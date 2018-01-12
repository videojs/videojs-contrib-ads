import videojs from 'video.js';

import * as snapshot from './snapshot.js';

/*
 * Encapsulates logic for starting and ending ad breaks. An ad break
 * is the time between startLinearAdMode and endLinearAdMode. The ad
 * integration may play 0 or more ads during this time.
 */
export default class AdBreak {

  constructor(player) {
    this.player = player;
  }

  start() {
    const player = this.player;

    videojs.log('Starting ad break');

    player.clearTimeout(player.ads.adTimeoutTimeout);

    player.ads._inLinearAdMode = true;

    // No longer does anything, used to move us to ad-playback
    player.trigger('adstart');

    // Capture current player state snapshot
    if (!player.ads.shouldPlayContentBehindAd(player)) {
      player.ads.snapshot = snapshot.getPlayerSnapshot(player);
    }

    // Mute the player behind the ad
    if (player.ads.shouldPlayContentBehindAd(player)) {
      player.ads.preAdVolume_ = player.volume();
      player.volume(0);
    }

    // Add css to the element to indicate and ad is playing.
    player.addClass('vjs-ad-playing');

    // We should remove the vjs-live class if it has been added in order to
    // show the adprogress control bar on Android devices for falsely
    // determined LIVE videos due to the duration incorrectly reported as Infinity
    if (player.hasClass('vjs-live')) {
      player.removeClass('vjs-live');
    }

    // remove the poster so it doesn't flash between ads
    player.ads.removeNativePoster();

    // We no longer need to supress play events once an ad is playing.
    // Clear it if we were.
    if (player.ads.cancelPlayTimeout) {
      // If we don't wait a tick, we could cancel the pause for cancelContentPlay,
      // resulting in content playback behind the ad
      player.setTimeout(function() {
        player.clearTimeout(player.ads.cancelPlayTimeout);
        player.ads.cancelPlayTimeout = null;
      }, 1);
    }
  }

  end() {
    const player = this.player;

    videojs.log('Ending ad break');

    player.ads.adType = null;

    player.ads._inLinearAdMode = false;

    // No longer does anything, used to move us to content-resuming
    player.trigger('adend');

    player.removeClass('vjs-ad-loading');
    player.removeClass('vjs-ad-playing');

    // We should add the vjs-live class back if the video is a LIVE video
    // If we dont do this, then for a LIVE Video, we will get an incorrect
    // styled control, which displays the time for the video
    if (player.ads.isLive(player)) {
      player.addClass('vjs-live');
    }
    if (!player.ads.shouldPlayContentBehindAd(player)) {
      snapshot.restorePlayerSnapshot(player, player.ads.snapshot);
    }

    // Reset the volume to pre-ad levels
    if (player.ads.shouldPlayContentBehindAd(player)) {
      player.volume(player.ads.preAdVolume_);
    }

    // If content has ended, trigger an ended event
    if (player.ads._contentHasEnded) {
      player.clearTimeout(player.ads._fireEndedTimeout);
      // in some cases, ads are played in a swf or another video element
      // so we do not get an ended event in this state automatically.
      // If we don't get an ended event we can use, we need to trigger
      // one ourselves or else we won't actually ever end the current video.
      player.ads._fireEndedTimeout = player.setTimeout(function() {
        videojs.log('Triggered ended event (endLinearAdMode)');
        player.trigger('ended');
      }, 1000);
    }
  }

}
