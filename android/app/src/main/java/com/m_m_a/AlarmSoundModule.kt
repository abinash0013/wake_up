package com.m_m_a

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmSoundModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var player: MediaPlayer? = null

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

  private fun stopInternal() {
    try {
      player?.stop()
    } catch (ignored: Exception) {
    }
    try {
      player?.release()
    } catch (ignored: Exception) {
    }
    player = null
  }

  @ReactMethod
  fun start(uri: String?, loop: Boolean, promise: Promise) {
    try {
      stopInternal()
      var soundUri = uri?.takeIf { it.isNotBlank() }
      if (soundUri == null) {
        soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)?.toString()
      }
      if (soundUri == null) {
        promise.reject("no_sound", "No default alarm sound available")
        return
      }
      val mediaPlayer = MediaPlayer()
      mediaPlayer.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build(),
      )
      mediaPlayer.setDataSource(reactContext, Uri.parse(soundUri))
      mediaPlayer.isLooping = loop
      mediaPlayer.setOnPreparedListener {
        mediaPlayer.start()
        promise.resolve(null)
      }
      mediaPlayer.setOnErrorListener { _, what, extra ->
        promise.reject("play_error", "Failed to play alarm sound ($what, $extra)")
        true
      }
      mediaPlayer.prepareAsync()
      player = mediaPlayer
    } catch (e: Exception) {
      promise.reject("play_error", e.message, e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      stopInternal()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("stop_error", e.message, e)
    }
  }
}