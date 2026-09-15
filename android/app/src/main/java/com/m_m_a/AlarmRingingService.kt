package com.m_m_a

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import androidx.core.content.ContextCompat

// Foreground service that owns the ringing alarm in the background. It plays
// the ringtone, vibrates and shows the full-screen dismiss popup. Started by
// AlarmReceiver (fired from AlarmManager) even when the app process was dead.
//
// When the alarm has walk steps configured, the alarm always shows a "Start
// Walking" action and can only be dismissed after the target is reached.
// Steps are counted natively with the hardware step sensor when available; if
// no sensor is present the JS layer (accelerometer) handles counting once the
// app is in the foreground.
class AlarmRingingService : Service() {

  companion object {
    private const val TAG = "AlarmRingingService"

    const val ACTION_STOP = "com.m_m_a.action.STOP_RINGING"
    const val ACTION_STEP_PROGRESS = "com.m_m_a.action.STEP_PROGRESS"
    const val ACTION_STOPPED = "com.m_m_a.action.ALARM_STOPPED"
    const val EXTRA_ALARM_ID = "alarm_id"
    const val EXTRA_WALKED = "walked"
    const val EXTRA_TARGET = "target"
    const val EXTRA_WALKING = "walking"

    // Peak-detection tuning for the accelerometer fallback (mirrors the
    // algorithm used by the JS useStepCounter hook).
    private const val ACCEL_THRESHOLD = 2.5
    private const val ACCEL_MIN_INTERVAL_MS = 300L

    private const val EXTRA_ALARM_JSON = AlarmScheduler.EXTRA_ALARM_JSON

    // Snapshot of the currently ringing alarm, exposed to JS via
    // AlarmNotificationModule.getRingingAlarm() so the React layer can
    // re-sync its state when the app is (re)opened while the alarm is active.
    @Volatile
    var currentRinging: RingingInfo? = null
      private set

    fun start(context: Context, alarmJson: String) {
      val intent = Intent(context, AlarmRingingService::class.java)
        .putExtra(EXTRA_ALARM_JSON, alarmJson)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ContextCompat.startForegroundService(context, intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, AlarmRingingService::class.java))
    }
  }

  data class RingingInfo(
    val id: String,
    val time: String,
    val walkTarget: Int,
    var walking: Boolean,
    var walked: Int,
  )

  private var vibrator: Vibrator? = null
  private var alarm: AlarmScheduler.AlarmData? = null
  private var walking = false
  private var walkTarget = 0
  private var walked = 0

  private var sensorManager: SensorManager? = null
  private var stepCounterSensor: Sensor? = null
  private var stepDetectorSensor: Sensor? = null
  private var accelerometerSensor: Sensor? = null
  private var baseSteps = -1f
  private var accelPreviousMagnitude = 0.0
  private var accelPreviousTime = 0L
  private var accelSteps = 0

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    val alarmJson = intent?.getStringExtra(EXTRA_ALARM_JSON)
    val parsed = AlarmScheduler.parse(alarmJson)
    if (parsed == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    alarm = parsed

    // Walk steps are always required to dismiss when configured — the native
    // surfaces show "Start Walking" based on walkTarget > 0 in every state
    // (foreground, background or killed). Steps are counted by the service
    // itself: it prefers the hardware step sensors and falls back to the
    // accelerometer (no permission needed) so counting keeps working even in
    // kill mode on devices without a step sensor.
    val target = parsed.walkTarget
    walkTarget = target
    walking = target > 0 && findSensors()
    walked = 0
    currentRinging = RingingInfo(parsed.id, parsed.time, walkTarget, walking, walked)

    // One failure below must never take the process (and the alarm) down —
    // especially on a cold start. Each step is guarded so the alarm keeps
    // ringing even if a sensor/vibration/audio hiccup occurs.
    try {
      startForeground(
        AlarmNotificationManager.NOTIFICATION_ID,
        AlarmNotificationManager.buildRingingNotification(
          this,
          parsed.time,
          walked,
          walkTarget,
          walking,
        ),
      )
    } catch (e: Exception) {
      Log.w(TAG, "Failed to show foreground notification", e)
    }

    try {
      AlarmSoundPlayer.start(this, parsed.soundUri, true)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to start alarm sound", e)
    }

    try {
      val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      this.vibrator = vibrator
      if (parsed.vibrate) {
        val pattern = longArrayOf(0, 600, 400, 600, 400)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(pattern, 0)
        }
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to start vibration", e)
    }

    if (walking) {
      try {
        startStepTracking()
      } catch (e: Exception) {
        Log.w(TAG, "Failed to start native step tracking, JS fallback will be used", e)
      }
    }

    AlarmNotificationModule.emitFired(parsed.id, parsed.time, walkTarget, walking, walked)
    return START_NOT_STICKY
  }

  private fun findSensors(): Boolean {
    val manager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    sensorManager = manager
    stepCounterSensor = manager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    stepDetectorSensor = manager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    accelerometerSensor = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    return stepCounterSensor != null || stepDetectorSensor != null || accelerometerSensor != null
  }

  private fun startStepTracking() {
    val manager = sensorManager ?: return
    // Prefer the hardware step sensors (most accurate); fall back through the
    // list so a denied/absent sensor never leaves the alarm ringing with no
    // way to count steps. The accelerometer requires no permission and exists
    // on virtually every device, so kill-mode counting is self-sufficient.
    var tracking = false
    try {
      if (stepCounterSensor != null) {
        manager.registerListener(stepListener, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL)
        tracking = true
      }
    } catch (e: SecurityException) {
      Log.w(TAG, "Step counter permission denied, falling back", e)
    }
    if (!tracking) {
      try {
        if (stepDetectorSensor != null) {
          manager.registerListener(detectListener, stepDetectorSensor, SensorManager.SENSOR_DELAY_NORMAL)
          tracking = true
        }
      } catch (e: SecurityException) {
        Log.w(TAG, "Step detector permission denied, falling back", e)
      }
    }
    if (!tracking && accelerometerSensor != null) {
      accelSteps = 0
      accelPreviousTime = 0L
      accelPreviousMagnitude = 0.0
      manager.registerListener(accelListener, accelerometerSensor, SensorManager.SENSOR_DELAY_UI)
      tracking = true
      Log.i(TAG, "Using accelerometer fallback for step counting")
    }
    if (!tracking) {
      walking = false
      currentRinging?.walking = false
      Log.w(TAG, "No sensor available, JS accelerometer fallback will be used")
    }
  }

  private val stepListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
      val value = event.values[0]
      if (baseSteps < 0f) {
        baseSteps = value
      }
      onStepsChanged((value - baseSteps).toInt())
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
  }

  private val detectListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
      onStepsChanged(walked + 1)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
  }

  // Peak detection on the accelerometer magnitude (no permission required).
  // Used on devices without a hardware step sensor or when activity
  // recognition was not granted, so the alarm can still be dismissed by
  // walking while the app is killed.
  private val accelListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
      val x = event.values[0].toDouble()
      val y = event.values[1].toDouble()
      val z = event.values[2].toDouble()
      val magnitude = Math.sqrt(x * x + y * y + z * z)
      val now = System.currentTimeMillis()
      if (accelPreviousTime == 0L) {
        accelPreviousTime = now
        accelPreviousMagnitude = magnitude
        return
      }
      if (magnitude - accelPreviousMagnitude > ACCEL_THRESHOLD &&
        now - accelPreviousTime > ACCEL_MIN_INTERVAL_MS
      ) {
        accelSteps += 1
        accelPreviousTime = now
        onStepsChanged(accelSteps)
      }
      accelPreviousMagnitude = magnitude
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
  }

  private fun onStepsChanged(count: Int) {
    if (walked == count) {
      return
    }
    walked = count
    currentRinging?.walked = count
    updateNotification()
    AlarmNotificationModule.emitStepProgress(alarm?.id ?: "", walked, walkTarget)
    val progress = Intent(ACTION_STEP_PROGRESS).setPackage(packageName)
      .putExtra(EXTRA_ALARM_ID, alarm?.id)
      .putExtra(EXTRA_WALKED, walked)
      .putExtra(EXTRA_TARGET, walkTarget)
      .putExtra(EXTRA_WALKING, walking)
    sendBroadcast(progress)

    if (walking && walked >= walkTarget) {
      stopSelf()
    }
  }

  private fun updateNotification() {
    val alarm = alarm ?: return
    val manager = getSystemService(NotificationManager::class.java)
    manager.notify(
      AlarmNotificationManager.NOTIFICATION_ID,
      AlarmNotificationManager.buildRingingNotification(
        this,
        alarm.time,
        walked,
        walkTarget,
        walking,
      ),
    )
  }

  override fun onDestroy() {
    sensorManager?.unregisterListener(stepListener)
    sensorManager?.unregisterListener(detectListener)
    sensorManager?.unregisterListener(accelListener)
    AlarmSoundPlayer.stop()
    vibrator?.cancel()
    AlarmNotificationManager.cancel(applicationContext)
    currentRinging = null
    AlarmNotificationModule.emitStopped()
    sendBroadcast(Intent(ACTION_STOPPED).setPackage(packageName))
    super.onDestroy()
  }
}