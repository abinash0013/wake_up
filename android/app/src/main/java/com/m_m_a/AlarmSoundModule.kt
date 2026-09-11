package com.m_m_a

import android.media.RingtoneManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmSoundModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AlarmSoundManager"

  private fun buildSoundMap(title: String, uri: String): com.facebook.react.bridge.ReadableMap =
    Arguments.createMap().apply {
      putString("title", title)
      putString("uri", uri)
    }

  @ReactMethod
  fun getAlarmSounds(promise: Promise) {
    try {
      val sounds = Arguments.createArray()
      val ringtoneManager = RingtoneManager(reactContext)
      ringtoneManager.setType(RingtoneManager.TYPE_ALARM)
      val cursor = ringtoneManager.cursor
      while (cursor.moveToNext()) {
        try {
          val id = cursor.getLong(RingtoneManager.ID_COLUMN_INDEX)
          val uri = cursor.getString(RingtoneManager.URI_COLUMN_INDEX)
          if (id > 0 && !uri.isNullOrBlank()) {
            sounds.pushMap(buildSoundMap(cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX), "$uri/$id"))
          }
        } catch (ignored: Exception) {
        }
      }
      cursor.close()
      promise.resolve(sounds)
    } catch (e: Exception) {
      promise.reject("alarm_sounds_error", e.message, e)
    }
  }

  @ReactMethod
  fun getDefaultAlarmUri(promise: Promise) {
    try {
      val defaultUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      promise.resolve(defaultUri?.toString())
    } catch (e: Exception) {
      promise.reject("default_sound_error", e.message, e)
    }
  }

  @ReactMethod
  fun start(uri: String?, loop: Boolean, promise: Promise) {
    try {
      AlarmSoundPlayer.start(
        reactContext,
        uri,
        loop,
        onReady = { promise.resolve(null) },
        onError = { promise.reject("play_error", it) },
      )
    } catch (e: Exception) {
      promise.reject("play_error", e.message, e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      AlarmSoundPlayer.stop()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("stop_error", e.message, e)
    }
  }
}