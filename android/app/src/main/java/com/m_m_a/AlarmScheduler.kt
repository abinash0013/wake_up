package com.nosnooze

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

// Schedules alarms at the OS level (AlarmManager), computes the next trigger
// using the same time/repeat format as the JS layer (e.g. "7:00 AM" +
// ["Mon","Tue",...]) and persists a copy of the alarm list so alarms can be
// re-armed after a reboot even before the app process is started.
object AlarmScheduler {

  const val ACTION_FIRE = "com.nosnooze.action.ALARM_FIRE"
  const val EXTRA_ALARM_JSON = "alarm_json"

  private const val PREFS = "alarm_scheduler"
  private const val KEY_ALARMS = "alarms_json"
  private const val KEY_SCHEDULED = "scheduled_ids"

  private val DAY_KEYS = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

  data class AlarmData(
    val id: String,
    val time: String,
    val repeatDays: List<String>,
    val enabled: Boolean,
    val vibrate: Boolean,
    val soundUri: String?,
    val name: String,
    val walkTarget: Int,
  )

  fun parse(alarmJson: String?): AlarmData? {
    if (alarmJson.isNullOrBlank()) {
      return null
    }
    return try {
      val o = JSONObject(alarmJson)
      val id = o.optString("id")
      val time = o.optString("time")
      if (id.isBlank() || time.isBlank()) {
        return null
      }
      AlarmData(
        id = id,
        time = time,
        repeatDays = o.optJSONArray("repeatDays")
          ?.let { arr -> (0 until arr.length()).map { arr.getString(it) } }
          ?: emptyList(),
        enabled = o.optBoolean("enabled", true),
        vibrate = o.optBoolean("vibrate", true),
        soundUri = o.optJSONObject("sound")?.optString("uri")?.takeIf { it.isNotBlank() },
        name = o.optString("name"),
        walkTarget = run {
          val fromSteps = o.optJSONArray("steps")
            ?.let { steps ->
              (0 until steps.length()).sumOf { i ->
                val step = steps.optJSONObject(i)
                if (step != null && step.optBoolean("enabled", true)) {
                  step.optJSONObject("config")?.optInt("target", 0) ?: 0
                } else {
                  0
                }
              }
            }
            ?: 0
          if (fromSteps > 0) fromSteps else o.optInt("walkTarget", 0)
        },
      )
    } catch (e: Exception) {
      null
    }
  }

  private fun parseAll(alarmsJson: String?): List<AlarmData> {
    if (alarmsJson.isNullOrBlank()) {
      return emptyList()
    }
    return try {
      val arr = JSONArray(alarmsJson)
      (0 until arr.length()).mapNotNull { i -> parse(arr.getJSONObject(i).toString()) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  private fun dayKeyFor(dayOfWeek: Int): String = DAY_KEYS[dayOfWeek - 1]

  private fun parseTimeToMillis(time: String, base: Calendar): Long {
    val trimmed = time.trim()
    val isPm = trimmed.endsWith("PM", ignoreCase = true)
    val isAm = trimmed.endsWith("AM", ignoreCase = true)
    var body = trimmed
      .removeSuffix("PM")
      .removeSuffix("pm")
      .removeSuffix("AM")
      .removeSuffix("am")
      .trim()
    var hour = body.substringBefore(":").trim().toIntOrNull() ?: 0
    val minute = body.substringAfter(":", "").trim().toIntOrNull() ?: 0
    if (isPm && hour != 12) {
      hour += 12
    }
    if (isAm && hour == 12) {
      hour = 0
    }
    val cal = base.clone() as Calendar
    cal.set(Calendar.HOUR_OF_DAY, hour)
    cal.set(Calendar.MINUTE, minute)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.timeInMillis
  }

  fun nextTrigger(time: String, repeatDays: List<String>, now: Long): Long? {
    val nowCal = Calendar.getInstance().apply { timeInMillis = now }
    for (offset in 0..7) {
      val base = (nowCal.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, offset) }
      val candidate = parseTimeToMillis(time, base)
      if (candidate <= now) {
        continue
      }
      val cal = Calendar.getInstance().apply { timeInMillis = candidate }
      if (repeatDays.contains(dayKeyFor(cal.get(Calendar.DAY_OF_WEEK)))) {
        return candidate
      }
    }
    return null
  }

  private fun requestCode(id: String): Int = ("alarm_$id").hashCode() and 0x7fffffff

  private fun alarmPendingIntent(context: Context, id: String, alarmJson: String?): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction(ACTION_FIRE)
      .putExtra(EXTRA_ALARM_JSON, alarmJson ?: "")
    return PendingIntent.getBroadcast(
      context,
      requestCode(id),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  fun scheduleNext(context: Context, alarm: AlarmData): Boolean {
    val trigger = nextTrigger(alarm.time, alarm.repeatDays, System.currentTimeMillis())
      ?: return false

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = alarmPendingIntent(context, alarm.id, alarm.toJson())

    val showIntent = PendingIntent.getActivity(
      context,
      requestCode("${alarm.id}_show"),
      Intent(context, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    try {
      if (Build.VERSION.SDK_INT < 31 || alarmManager.canScheduleExactAlarms()) {
        alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(trigger, showIntent), pi)
      } else {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi)
      }
    } catch (ignored: SecurityException) {
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi)
    }
    return true
  }

  fun cancel(context: Context, id: String) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(alarmPendingIntent(context, id, null))
  }

  // Re-arms every alarm from a serialized list. Call after any change and on
  // boot. Disabled/deleted alarms are cancelled.
  fun rescheduleAll(context: Context, alarmsJson: String?) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_ALARMS, alarmsJson ?: "[]").apply()

    val alarms = parseAll(alarmsJson)
    val newScheduledIds = mutableSetOf<String>()
    for (alarm in alarms) {
      if (alarm.enabled && scheduleNext(context, alarm)) {
        newScheduledIds += alarm.id
      } else {
        cancel(context, alarm.id)
      }
    }

    val previous = prefs.getStringSet(KEY_SCHEDULED, emptySet()) ?: emptySet()
    for (id in previous) {
      if (id !in newScheduledIds) {
        cancel(context, id)
      }
    }
    prefs.edit().putStringSet(KEY_SCHEDULED, newScheduledIds).apply()
  }

  fun persistedAlarms(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return prefs.getString(KEY_ALARMS, null)
  }

  // Looks up the original (persisted) alarm data, which keeps the full steps
  // config. Re-scheduling from this instead of a serialized AlarmData avoids
  // losing the walk target when a PendingIntent was scheduled by an older,
  // buggy build that dropped the steps array.
  fun findPersistedAlarm(context: Context, id: String): AlarmData? {
    val json = persistedAlarms(context) ?: return null
    return parseAll(json).find { it.id == id }
  }
}

fun AlarmScheduler.AlarmData.toJson(): String =
  JSONObject()
    .put("id", id)
    .put("time", time)
    .put("repeatDays", JSONArray(repeatDays))
    .put("enabled", enabled)
    .put("vibrate", vibrate)
    .put("name", name)
    .put("sound", if (soundUri != null) JSONObject().put("uri", soundUri) else JSONObject.NULL)
    .put("walkTarget", walkTarget)
    .toString()