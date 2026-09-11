package com.m_m_a

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

// Builds/posts the ringing-alarm notification. It carries a full-screen intent
// (pops up over the lock screen / app) and a "Start Walking" action so the
// user is prompted to walk to dismiss the alarm even when the app is closed
// or in the background.
object AlarmNotificationManager {

  const val CHANNEL_ID = "alarm_ringing"
  const val CHANNEL_NAME = "Ringing alarm"
  const val NOTIFICATION_ID = 1001

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Ringing alarm"
        setSound(null, null) // Audio is handled by AlarmSoundPlayer.
        enableVibration(false)
      }
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  fun buildRingingNotification(
    context: Context,
    time: String?,
    walked: Int = 0,
    target: Int = 0,
    walking: Boolean = false,
  ): Notification {
    ensureChannel(context)

    val dismissIntent = Intent(context, AlarmDismissActivity::class.java)
      .putExtra(AlarmDismissActivity.EXTRA_ALARM_TIME, time)
      .putExtra(AlarmRingingService.EXTRA_WALKED, walked)
      .putExtra(AlarmRingingService.EXTRA_TARGET, target)
      .putExtra(AlarmRingingService.EXTRA_WALKING, walking)
    val fullScreenPendingIntent = PendingIntent.getActivity(
      context,
      0,
      dismissIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val stopIntent = Intent(context, AlarmRingingService::class.java)
      .setAction(AlarmRingingService.ACTION_STOP)
    val stopPendingIntent = PendingIntent.getService(
      context,
      1,
      stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val icon = android.R.drawable.ic_lock_idle_alarm

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(context, CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }

    val isWalking = target > 0

    builder
      .setSmallIcon(icon)
      .setContentTitle("Alarm")
      .setContentText(if (isWalking) "Walk $walked / $target steps" else "Time to wake up!")
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setPriority(Notification.PRIORITY_MAX)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setContentIntent(fullScreenPendingIntent)
      .setOngoing(true)
      .setAutoCancel(false)
      .setDefaults(0)

    if (isWalking) {
      builder.setProgress(target, walked, false)
      builder.addAction(icon, "Start Walking", fullScreenPendingIntent)
    } else {
      builder.setProgress(0, 0, false)
      builder.addAction(icon, "Stop Alarm", stopPendingIntent)
    }

    return builder.build()
  }

  fun showRinging(context: Context, time: String?) {
    if (Build.VERSION.SDK_INT >= 33 &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(NOTIFICATION_ID, buildRingingNotification(context, time))
  }

  fun cancel(context: Context) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.cancel(NOTIFICATION_ID)
  }
}