import videojs from 'video.js';

import {AdState, BeforePreroll, Preroll, AdsDone} from '../states.js';
import adBreak from '../adBreak.js';

export default class Postroll extends AdState {

  init(player) {
    // Legacy name that now simply means "handling postrolls".
    player.ads._contentEnding = true;

    // Start postroll process.
    if (!player.ads.nopostroll_) {
      player.addClass('vjs-ad-loading');

      // Determine postroll timeout based on plugin settings
      let timeout = player.ads.settings.timeout;

      if (typeof player.ads.settings.postrollTimeout === 'number') {
        timeout = player.ads.settings.postrollTimeout;
      }

      this._postrollTimeout = player.setTimeout(function() {
        player.trigger('adtimeout');
      }, timeout);

    // No postroll, ads are done
    } else {
      player.setTimeout(() => {
        player.ads.debug('Triggered ended event (no postroll)');
        this.contentResuming = true;
        player.trigger('ended');
      }, 1);
    }
  }

  /*
   * Start the postroll if it's not too late.
   */
  startLinearAdMode() {
    const player = this.player;

    if (!player.ads.inAdBreak() && !this.isContentResuming()) {
      player.ads.adType = 'postroll';
      player.clearTimeout(this._postrollTimeout);
      adBreak.start(player);
    } else {
      videojs.log.warn('Unexpected startLinearAdMode invocation (Postroll)');
    }
  }

  /*
   * An ad has actually started playing.
   * Remove the loading spinner.
   */
  onAdStarted(player) {
    player.removeClass('vjs-ad-loading');
  }

  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      player.removeClass('vjs-ad-loading');
      adBreak.end(player);

      this.contentResuming = true;

      player.ads.debug('Triggered ended event (endLinearAdMode)');
      player.trigger('ended');
    }
  }

  skipLinearAdMode() {
    const player = this.player;

    if (player.ads.inAdBreak() || this.isContentResuming()) {
      videojs.log.warn('Unexpected skipLinearAdMode invocation');
    } else {
      player.ads.debug('Postroll abort (skipLinearAdMode)');
      player.trigger('adskip');
      this.abort();
    }
  }

  onAdTimeout(player) {
    player.ads.debug('Postroll abort (adtimeout)');
    this.abort();
  }

  onAdsError(player) {
    player.ads.debug('Postroll abort (adserror)');

    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (player.ads.inAdBreak()) {
      player.ads.endLinearAdMode();
    }

    this.abort();
  }

  onEnded() {
    if (this.isContentResuming()) {
      this.transitionTo(AdsDone);
    } else {
      videojs.log.warn('Unexpected ended event during postroll');
    }
  }

  onContentChanged(player) {
    if (this.isContentResuming()) {
      this.transitionTo(BeforePreroll);
    } else if (!this.inAdBreak()) {
      this.transitionTo(Preroll);
    }
  }

  onNoPostroll(player) {
    if (!this.isContentResuming() && !this.inAdBreak()) {
      this.transitionTo(AdsDone);
    } else {
      videojs.log.warn('Unexpected nopostroll event (Postroll)');
    }
  }

  abort() {
    const player = this.player;

    this.contentResuming = true;
    player.removeClass('vjs-ad-loading');

    player.ads.debug('Triggered ended event (postroll abort)');
    player.trigger('ended');
  }

  cleanup() {
    const player = this.player;

    player.clearTimeout(this._postrollTimeout);
    player.ads._contentEnding = false;
  }

}
