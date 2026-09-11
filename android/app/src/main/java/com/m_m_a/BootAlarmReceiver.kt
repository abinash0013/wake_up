package com.m_m_a

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Re-arms all alarms after a reboot / clock / timezone change using the copy
// of the alarm list persisted by AlarmScheduler.
class BootAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action
    if (action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_TIME_CHANGED &&
      action != Intent.ACTION_TIMEZONE_CHANGED
    ) {
      return
    }
    val alarmsJson = AlarmScheduler.persistedAlarms(context) ?: return
    AlarmScheduler.rescheduleAll(context, alarmsJson)
  }
}