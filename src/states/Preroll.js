import videojs from 'video.js';

import {AdState, BeforePreroll, ContentPlayback} from './States.js';
import cancelContentPlay from '../cancelContentPlay.js';
import {startAdBreak, endAdBreak} from '../adBreak.js';

/*
 * This state encapsulates checking for prerolls, preroll playback, and
 * content restoration after a preroll.
 */
export default class Preroll extends AdState {

  constructor(player, adsReady) {
    super(player);
    this.name = 'Preroll';
    this.adsReady = false;

    videojs.log('Now in Preroll state');

    // Loading spinner from now until ad start or end of ad break.
    player.addClass('vjs-ad-loading');

    // Start the clock ticking for ad timeout
    this._timeout = player.setTimeout(function() {
      player.trigger('adtimeout');
    }, player.ads.settings.timeout);

    // If adsready already happened, lets get started. Otherwise,
    // wait until onAdsReady.
    if (adsReady) {
      this.handleAdsReady();
    }
  }

  onAdsReady() {
    videojs.log('Received adsready event (Preroll)');
    this.handleAdsReady();
  }

  /*
   * Ad integration is ready. Let's get started on this preroll.
   */
  handleAdsReady() {
    this.adsReady = true;
    if (this.player.ads.nopreroll_) {
      this.noPreroll();
    } else {
      this.readyForPreroll();
    }
  }

  noPreroll() {
    videojs.log('Skipping prerolls due to nopreroll event');
    this.transitionTo(ContentPlayback);
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
   * Don't allow the content to start playing while we're dealing with ads.
   */
  onPlay() {
    videojs.log('Received play event (Preroll)');

    if (!this.inAdBreak() && !this.isContentResuming()) {
      cancelContentPlay(this.player);
    }
  }

  onAdsCanceled() {
    videojs.log('adscanceled (Preroll)');

    this.transitionTo(ContentPlayback);
  }

  /*
   * An ad error occured. Play content instead.
   */
  onAdsError() {
    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (this.inAdBreak()) {
      this.player.ads.endLinearAdMode();
    }

    this.transitionTo(ContentPlayback);
  }

  startLinearAdMode() {
    const player = this.player;

    if (this.adsReady && !player.ads.inAdBreak() && !this.isContentResuming()) {
      player.clearTimeout(this._timeout);
      player.ads.adType = 'preroll';
      startAdBreak(player);

      // This removes the native poster so the ads don't show the content
      // poster if content element is used for ad playback.
      player.ads.removeNativePoster();
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  onAdStarted() {
    const player = this.player;

    player.removeClass('vjs-ad-loading');
  }

  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      player.removeClass('vjs-ad-loading');
      endAdBreak(player);
      this.contentResuming = true;
    }
  }

  /*
   * Ad skipped by integration. Play content instead.
   */
  skipLinearAdMode() {
    const player = this.player;

    if (player.ads.inAdBreak() || this.isContentResuming()) {
      videojs.log('Unexpected skipLinearAdMode invocation');
    } else {
      player.trigger('adskip');

      videojs.log('skipLinearAdMode (Preroll)');
      this.transitionTo(ContentPlayback);
    }
  }

  /*
   * Prerolls took too long! Play content instead.
   */
  onAdTimeout() {
    videojs.log('adtimeout (Preroll)');
    this.transitionTo(ContentPlayback);
  }

  onNoPreroll() {
    if (this.adsReady) {
      videojs.log('Ignoring nopreroll event after both play and adsready');
    } else {
      this.noPreroll();
    }
  }

  onContentUpdate() {
    if (this.contentResuming) {
      this.transitionTo(BeforePreroll);
    }
  }

  cleanup() {
    const player = this.player;

    player.removeClass('vjs-ad-loading');
    player.clearTimeout(this._timeout);
  }

}
