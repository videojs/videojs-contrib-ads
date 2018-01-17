import videojs from 'video.js';

import {AdState, ContentPlayback} from './RenameMe.js';
import cancelContentPlay from '../cancelContentPlay.js';
import AdBreak from '../AdBreak.js';

/*
 * This state encapsulates checking for prerolls, preroll playback, and
 * content restoration after a preroll.
 */
export default class Preroll extends AdState {

  constructor(player, adsReady) {
    super(player);
    this.name = 'Preroll';
    this.adsReady = false;

    videojs.log('Now in ' + this.name + ' state');

    // Loading spinner from now until preroll or content resume.
    player.addClass('vjs-ad-loading');

    // Start the clock ticking for ad timeout
    // TODO this should be canceled in onAdsError et al
    player.ads.adTimeoutTimeout = player.setTimeout(function() {
      player.trigger('adtimeout');
    }, player.ads.settings.timeout);

    // If adsready already happened, lets get started. Otherwise,
    // wait until onAdsReady.
    if (adsReady) {
      this.onAdsReady(true);
    }
  }

  /*
   * Ad integration is ready. Let's get started on this preroll.
   */
  onAdsReady(noLog) {
    this.adsReady = true;
    if (noLog !== true) {
      videojs.log('Received adsready event');
    }
    if (this.player.ads.nopreroll_) {
      this.noPreroll();
    } else {
      this.readyForPreroll();
    }
  }

  noPreroll() {
    const player = this.player;

    videojs.log('Skipping prerolls due to nopreroll event');
    player.clearTimeout(player.ads.adTimeoutTimeout);
    this.player.ads.stateInstance = new ContentPlayback(this.player);
  }

  readyForPreroll() {
    const player = this.player;

    // Signal to ad plugin that it's their opportunity to play a preroll
    if (player.ads._hasThereBeenALoadStartDuringPlayerLife) {
      videojs.log('Triggered readyforpreroll event');
      player.trigger('readyforpreroll');

    // Don't play preroll before loadstart, otherwise the content loadstart event
    // will get misconstrued as an ad loadstart. This is only a concern for the
    // initial source; for source changes the whole ad process is kicked off by
    // loadstart so it has to have happened already.
    } else {
      player.one('loadstart', () => {
        videojs.log('Triggered readyforpreroll event');
        player.trigger('readyforpreroll');
      });
    }
  }

  /*
   * Don't let the content play behind the ad!
   */
  onPlay() {

    videojs.log('Received play event (Preroll)');

    // TODO is this in all 4 original states?
    cancelContentPlay(this.player);
  }

  /*
   * TODO The adscanceled event seems to be redundant. We should consider removing it.
   * skipLinearAdMode does the same thing, but in a more robust way.
   */
  onAdsCanceled() {
    videojs.log('adscanceled (Preroll)');

    this.player.removeClass('vjs-ad-loading');
    this.player.ads.stateInstance = new ContentPlayback(this.player);
  }

  /*
   * An ad error occured. Play content instead.
   */
  onAdsError() {
    videojs.log('adserror (Preroll)');

    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }

    this.player.removeClass('vjs-ad-loading');
    this.player.ads.stateInstance = new ContentPlayback(this.player);
  }

  startLinearAdMode() {
    const player = this.player;

    if (this.adsReady && !player.ads.isAdPlaying() && !this.isContentResuming()) {
      player.ads.adType = 'preroll';
      this.adBreak = new AdBreak(player);
      this.adBreak.start();
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  endLinearAdMode() {
    if (this.adBreak) {
      this.adBreak.end();
      delete this.adBreak;
      this.contentResuming = true;
    }
  }

  /*
   * Ad skipped by integration. Play content instead.
   */
  skipLinearAdMode() {
    const player = this.player;

    if (player.ads.isAdPlaying() || this.isContentResuming()) {
      videojs.log('Unexpected skipLinearAdMode invocation');
    } else {
      player.trigger('adskip');
      this.player.removeClass('vjs-ad-loading');

      videojs.log('skipLinearAdMode (Preroll)');
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  /*
   * Prerolls took too long! Play content instead.
   */
  onAdTimeout() {
    this.player.removeClass('vjs-ad-loading');

    videojs.log('adtimeout (Preroll)');
    this.player.ads.stateInstance = new ContentPlayback(this.player);
  }

  onNoPreroll() {
    if (this.adsReady) {
      videojs.log('Ignoring nopreroll event after both play and adsready');
    } else {
      this.noPreroll();
    }
  }

}
