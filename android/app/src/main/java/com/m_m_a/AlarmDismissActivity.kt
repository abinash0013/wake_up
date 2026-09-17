package com.nosnooze

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat

// Full-screen, lock-screen capable popup shown by the alarm notification.
// When the alarm has walk steps configured it shows a live step counter and
// a "Start Walking" action — the alarm can only be turned off by reaching
// the target. Without steps it keeps a Stop button.
class AlarmDismissActivity : Activity() {

  private var walking = false
  private var walkTarget = 0
  private var walked = 0

  private val progressReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
      when (intent?.action) {
        AlarmRingingService.ACTION_STEP_PROGRESS -> {
          walking = intent.getBooleanExtra(AlarmRingingService.EXTRA_WALKING, false)
          walkTarget = intent.getIntExtra(AlarmRingingService.EXTRA_TARGET, 0)
          walked = intent.getIntExtra(AlarmRingingService.EXTRA_WALKED, 0)
          renderState()
          if (walkTarget > 0 && walked >= walkTarget) {
            finish()
          }
        }
        AlarmRingingService.ACTION_STOPPED -> finish()
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      )
    }

    setContentView(R.layout.activity_alarm_dismiss)

    findViewById<TextView>(R.id.alarmTitle).text = getString(R.string.app_name)
    findViewById<TextView>(R.id.alarmTime).text =
      intent.getStringExtra(EXTRA_ALARM_TIME).orEmpty()

    walking = intent.getBooleanExtra(AlarmRingingService.EXTRA_WALKING, false)
    walked = intent.getIntExtra(AlarmRingingService.EXTRA_WALKED, 0)
    walkTarget = intent.getIntExtra(AlarmRingingService.EXTRA_TARGET, 0)

    findViewById<Button>(R.id.startWalkingButton).setOnClickListener {
      val remaining = (walkTarget - walked).coerceAtLeast(0)
      Toast.makeText(this, "Walk $remaining more steps!", Toast.LENGTH_SHORT).show()
      openApp()
    }
    findViewById<Button>(R.id.stopAlarmButton).setOnClickListener { stopAndFinish() }

    renderState()
  }

  override fun onStart() {
    super.onStart()
    ContextCompat.registerReceiver(
      this,
      progressReceiver,
      IntentFilter().apply {
        addAction(AlarmRingingService.ACTION_STEP_PROGRESS)
        addAction(AlarmRingingService.ACTION_STOPPED)
      },
      ContextCompat.RECEIVER_EXPORTED,
    )
  }

  override fun onStop() {
    unregisterReceiver(progressReceiver)
    super.onStop()
  }

  private fun renderState() {
    val progressText = findViewById<TextView>(R.id.stepProgressText)
    val startButton = findViewById<Button>(R.id.startWalkingButton)
    val stopButton = findViewById<Button>(R.id.stopAlarmButton)

    if (walkTarget > 0) {
      progressText.visibility = android.view.View.VISIBLE
      progressText.text = "Walk $walked / $walkTarget steps"
      startButton.visibility = android.view.View.VISIBLE
      stopButton.visibility = android.view.View.GONE
    } else {
      progressText.visibility = android.view.View.GONE
      startButton.visibility = android.view.View.GONE
      stopButton.visibility = android.view.View.VISIBLE
    }
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    // Walking mode: back dismisses the popup but the alarm keeps ringing
    // until the target is reached.
    if (walkTarget > 0) {
      finish()
    } else {
      stopAndFinish()
    }
    super.onBackPressed()
  }

  private fun stopAndFinish() {
    AlarmRingingService.stop(applicationContext)
    finish()
  }

  // "Start Walking" brings the React app to the front so its step UI takes
  // over the live count. This also recovers the app process after a kill
  // without the user having to search for the icon. The alarm keeps ringing
  // until the step target is reached.
  private fun openApp() {
    val intent = Intent(this, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    startActivity(intent)
  }

  companion object {
    const val EXTRA_ALARM_TIME = "alarm_time"
  }
}