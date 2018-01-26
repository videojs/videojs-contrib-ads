import videojs from 'video.js';

import {AdState, ContentPlayback} from '../states.js';
import cancelContentPlay from '../cancelContentPlay.js';
import {startAdBreak, endAdBreak} from '../adBreak.js';

/*
 * This state encapsulates waiting for prerolls, preroll playback, and
 * content restoration after a preroll.
 */
export default class Preroll extends AdState {

  init(player, adsReady) {
    // Loading spinner from now until ad start or end of ad break.
    player.addClass('vjs-ad-loading');

    // Start the clock ticking for ad timeout
    this._timeout = player.setTimeout(function() {
      player.trigger('adtimeout');
    }, player.ads.settings.prerollTimeout);

    // If adsready already happened, lets get started. Otherwise,
    // wait until onAdsReady.
    if (adsReady) {
      this.handleAdsReady();
    } else {
      this.adsReady = false;
    }
  }

  onAdsReady(player) {
    player.ads.debug('Received adsready event (Preroll)');
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

  /*
   * If there is no preroll, play content instead.
   */
  noPreroll() {
    this.player.ads.debug('Skipping prerolls due to nopreroll event');
    this.transitionTo(ContentPlayback);
  }

  /*
   * Fire the readyforpreroll event. If loadstart hasn't happened yet,
   * wait until loadstart first.
   */
  readyForPreroll() {
    const player = this.player;

    // Signal to ad plugin that it's their opportunity to play a preroll.
    if (player.ads._hasThereBeenALoadStartDuringPlayerLife) {
      player.ads.debug('Triggered readyforpreroll event (Preroll)');
      player.trigger('readyforpreroll');

    // Don't play preroll before loadstart, otherwise the content loadstart event
    // will get misconstrued as an ad loadstart. This is only a concern for the
    // initial source; for source changes the whole ad process is kicked off by
    // loadstart so it has to have happened already.
    } else {
      player.one('loadstart', () => {
        player.ads.debug('Triggered readyforpreroll event (loadstart)');
        player.trigger('readyforpreroll');
      });
    }
  }

  /*
   * Don't allow the content to start playing while we're dealing with ads.
   */
  onPlay(player) {
    player.ads.debug('Received play event (Preroll)');

    if (!this.inAdBreak() && !this.isContentResuming()) {
      cancelContentPlay(this.player);
    }
  }

  /*
   * adscanceled cancels all ads for the source. Play content now.
   */
  onAdsCanceled(player) {
    player.ads.debug('adscanceled (Preroll)');

    this.transitionTo(ContentPlayback);
  }

  /*
   * An ad error occured. Play content instead.
   */
  onAdsError(player) {
    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (this.inAdBreak()) {
      player.ads.endLinearAdMode();
    }

    this.transitionTo(ContentPlayback);
  }

  /*
   * Integration invoked startLinearAdMode, the ad break starts now.
   */
  startLinearAdMode() {
    const player = this.player;

    if (this.adsReady && !player.ads.inAdBreak() && !this.isContentResuming()) {
      player.clearTimeout(this._timeout);
      player.ads.adType = 'preroll';
      startAdBreak(player);
    } else {
      videojs.log.warn('Unexpected startLinearAdMode invocation (Preroll)');
    }
  }

  /*
   * An ad has actually started playing.
   * Remove the loading spinner.
   */
  onAdStarted(player) {
    player.removeClass('vjs-ad-loading');
  }

  /*
   * Integration invoked endLinearAdMode, the ad break ends now.
   */
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
      videojs.log.warn('Unexpected skipLinearAdMode invocation');
    } else {
      player.trigger('adskip');

      player.ads.debug('skipLinearAdMode (Preroll)');
      this.transitionTo(ContentPlayback);
    }
  }

  /*
   * Prerolls took too long! Play content instead.
   */
  onAdTimeout(player) {
    player.ads.debug('adtimeout (Preroll)');
    this.transitionTo(ContentPlayback);
  }

  /*
   * Check if nopreroll event was too late before handling it.
   */
  onNoPreroll(player) {
    if (this.adsReady) {
      videojs.log.warn('Unexpected nopreroll event after both play and adsready');
    } else {
      this.noPreroll();
    }
  }

  /*
   * Changing the content source during an ad break is not supported.
   * Source change before preroll ad break resets the preroll process.
   * Source change while content is resuming resets the preroll process.
   */
  onContentUpdate() {
    if (this.inAdBreak()) {
      videojs.log.warn('Unexpected contentupdate during ad break.');
    } else {
      this.adsReady = false;
    }
  }

  /*
   * Cleanup timeouts and spinner.
   */
  cleanup() {
    const player = this.player;

    player.removeClass('vjs-ad-loading');
    player.clearTimeout(this._timeout);
  }

}
