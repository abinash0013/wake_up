package com.m_m_a

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri

// Single shared sound player used by the JS bridge, the full-screen alarm
// activity and the notification "Stop" receiver so that dismissing the alarm
// from anywhere reliably stops the ringtone.
object AlarmSoundPlayer {

  private var player: MediaPlayer? = null

  @Synchronized
  fun start(
    context: Context,
    uri: String?,
    loop: Boolean,
    onReady: (() -> Unit)? = null,
    onError: ((String) -> Unit)? = null,
  ) {
    stop()
    var soundUri = uri?.takeIf { it.isNotBlank() }
    if (soundUri == null) {
      soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)?.toString()
    }
    if (soundUri == null) {
      onError?.invoke("No default alarm sound available")
      return
    }
    val mediaPlayer = MediaPlayer()
    try {
      mediaPlayer.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build(),
      )
      mediaPlayer.setDataSource(context, Uri.parse(soundUri))
    } catch (e: Exception) {
      try {
        mediaPlayer.release()
      } catch (ignored: Exception) {
      }
      onError?.invoke("Failed to load alarm sound: ${e.message}")
      return
    }
    mediaPlayer.isLooping = loop
    mediaPlayer.setOnPreparedListener {
      try {
        mediaPlayer.start()
      } catch (e: Exception) {
        onError?.invoke("Failed to start alarm sound: ${e.message}")
      }
      onReady?.invoke()
    }
    mediaPlayer.setOnErrorListener { _, what, extra ->
      onError?.invoke("Failed to play alarm sound ($what, $extra)")
      true
    }
    try {
      mediaPlayer.prepareAsync()
    } catch (e: Exception) {
      try {
        mediaPlayer.release()
      } catch (ignored: Exception) {
      }
      onError?.invoke("Failed to prepare alarm sound: ${e.message}")
      return
    }
    player = mediaPlayer
  }

  @Synchronized
  fun stop() {
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
}