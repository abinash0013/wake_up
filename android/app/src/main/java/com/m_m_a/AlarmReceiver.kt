package com.m_m_a

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Fired by AlarmManager when an alarm time is reached — even if the app
// process was killed. Starts the ringing service and arms the next occurrence.
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != AlarmScheduler.ACTION_FIRE) {
      return
    }
    val alarmJson = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_JSON) ?: return
    val alarm = AlarmScheduler.parse(alarmJson) ?: return

    if (alarm.enabled) {
      // Re-arm from the persisted alarm (keeps the full steps config) so the
      // next occurrence keeps working even if the incoming JSON was produced
      // by an older build that dropped the walk target.
      AlarmScheduler.findPersistedAlarm(context, alarm.id)?.let {
        AlarmScheduler.scheduleNext(context, it)
      } ?: AlarmScheduler.scheduleNext(context, alarm)
    }
    // Ring with the persisted alarm config (correct walk target) instead of
    // the PendingIntent extra, so "Start Walking" is always enforced when the
    // alarm has steps — even in kill mode / cold start.
    AlarmRingingService.start(
      context,
      (AlarmScheduler.findPersistedAlarm(context, alarm.id) ?: alarm).toJson(),
    )
  }
}