package com.m_m_a

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// JS bridge for OS-level scheduling. JS pushes the current alarm list here so
// AlarmManager can fire alarms even when the app process is killed, and asks
// the ringing service to stop when the user dismisses from inside the app.
class AlarmSchedulerManager(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AlarmSchedulerManager"

  @ReactMethod
  fun rescheduleAll(alarmsJson: String, promise: Promise) {
    try {
      AlarmScheduler.rescheduleAll(reactContext, alarmsJson)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("reschedule_error", e.message, e)
    }
  }

  @ReactMethod
  fun stopRinging(promise: Promise) {
    try {
      AlarmRingingService.stop(reactContext)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("stop_ringing_error", e.message, e)
    }
  }
}