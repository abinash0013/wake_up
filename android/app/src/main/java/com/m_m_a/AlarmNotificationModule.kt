package com.m_m_a

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

// JS bridge for the ringing notification. Also emits "AlarmFired"/"AlarmStopped"
// to the React layer whenever the alarm fires or is dismissed from a native
// surface (AlarmManager, the full-screen activity or the notification action)
// so JS can keep its state in sync.
class AlarmNotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private var reactContextRef: ReactApplicationContext? = null

    fun emitStopped() {
      reactContextRef
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("AlarmStopped", null)
    }

    fun emitFired(
      alarmId: String,
      time: String,
      walkTarget: Int = 0,
      walking: Boolean = false,
      walked: Int = 0,
    ) {
      val args = Arguments.createMap().apply {
        putString("id", alarmId)
        putString("time", time)
        putInt("walkTarget", walkTarget)
        putBoolean("walking", walking)
        putInt("walked", walked)
      }
      reactContextRef
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("AlarmFired", args)
    }

    fun emitStepProgress(alarmId: String, walked: Int, target: Int) {
      val args = Arguments.createMap().apply {
        putString("id", alarmId)
        putInt("walked", walked)
        putInt("target", target)
      }
      reactContextRef
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("StepProgress", args)
    }
  }

  override fun getName(): String = "AlarmNotificationManager"

  override fun initialize() {
    super.initialize()
    reactContextRef = reactContext
  }

  @ReactMethod
  fun showRinging(time: String?, promise: Promise) {
    try {
      AlarmNotificationManager.showRinging(reactContext, time)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("show_notification_error", e.message, e)
    }
  }

  // Returns the currently ringing alarm (if any) so JS can re-sync state when
  // the app is opened while the alarm is already ringing (e.g. fired while the
  // app was killed — in that case the AlarmFired event was never delivered).
  @ReactMethod
  fun getRingingAlarm(promise: Promise) {
    try {
      val info = AlarmRingingService.currentRinging
      if (info == null) {
        promise.resolve(null)
        return
      }
      val args = Arguments.createMap().apply {
        putString("id", info.id)
        putString("time", info.time)
        putInt("walkTarget", info.walkTarget)
        putBoolean("walking", info.walking)
        putInt("walked", info.walked)
      }
      promise.resolve(args)
    } catch (e: Exception) {
      promise.reject("get_ringing_error", e.message, e)
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    try {
      AlarmNotificationManager.cancel(reactContext)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("cancel_notification_error", e.message, e)
    }
  }
}