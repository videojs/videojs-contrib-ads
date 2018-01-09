import videojs from 'video.js';

import State from './State.js';
import * as snapshot from '../../snapshot.js';
import BeforePreroll from '../BeforePreroll.js';
import ContentPlayback from '../ContentPlayback.js';

/*
 * This class contains logic for all ads, be they prerolls, midrolls, or postrolls.
 * Primarily, this involves handling startLinearAdMode and endLinearAdMode.
 * It also handles content resuming.
 */
export default class AdState extends State {

  constructor(player) {
    super(player);
    this.contentResuming = false;
  }

  isAdState() {
    return true;
  }

  startLinearAdMode() {
    const player = this.player;

    player.ads.adType = this.adType;
    player.clearTimeout(player.ads.adTimeoutTimeout);

    if (player.ads.state === 'preroll?' ||
        player.ads.state === 'content-playback' ||
        player.ads.state === 'postroll?') {
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
  }

  /*
   * Integration has finished playing an ad.
   */
  endLinearAdMode() {
    const player = this.player;

    videojs.log('endLinearAdMode');

    player.ads.adType = null;

    if (player.ads.state === 'ad-playback') {
      player.ads._inLinearAdMode = false;

      // No longer does anything, used to move us to content-resuming
      player.trigger('adend');

      // In the case of an empty ad response, we want to make sure that
      // the vjs-ad-loading class is always removed. We could probably check for
      // duration on adPlayer for an empty ad but we remove it here just to make sure
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

      // We are now concerned with resuming the content
      this.contentResuming = true;

      // If content has ended, trigger an ended event
      if (player.ads._contentHasEnded) {
        player.clearTimeout(player.ads._fireEndedTimeout);
        // in some cases, ads are played in a swf or another video element
        // so we do not get an ended event in this state automatically.
        // If we don't get an ended event we can use, we need to trigger
        // one ourselves or else we won't actually ever end the current video.
        player.ads._fireEndedTimeout = player.setTimeout(function() {
          player.trigger('ended');
        }, 1000);
      }
    }

  }

  onContentUpdate() {
    // If the source changes while resuming content, go back to initial state
    // for the new source.
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new BeforePreroll(this.player);
    }
  }

  onContentResumed() {
    videojs.log('onContentResumed');
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  onPlaying() {
    videojs.log('onPlaying');
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  onEnded() {
    videojs.log('onEnded');
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

}
