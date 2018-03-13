import videojs from 'video.js';

import {AdState, BeforePreroll, Preroll, AdsDone} from '../states.js';
import adBreak from '../adBreak.js';

export default class Postroll extends AdState {

  /*
   * Allows state name to be logged even after minification.
   */
  static _getName() {
    return 'Postroll';
  }

  /*
   * For state transitions to work correctly, initialization should
   * happen here, not in a constructor.
   */
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

  /*
   * Ending a postroll triggers the ended event.
   */
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

  /*
   * Postroll skipped, time to clean up.
   */
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

  /*
   * Postroll timed out, time to clean up.
   */
  onAdTimeout(player) {
    player.ads.debug('Postroll abort (adtimeout)');
    this.abort();
  }

  /*
   * Postroll errored out, time to clean up.
   */
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

  /*
   * On ended, transition to AdsDone state.
   */
  onEnded() {
    if (this.isContentResuming()) {
      this.transitionTo(AdsDone);
    } else {
      videojs.log.warn('Unexpected ended event during postroll');
    }
  }

  /*
   * Handle content change if we're not in an ad break.
   */
  onContentChanged(player) {
    // Content resuming after Postroll. Content is paused
    // at this point, since it is done playing.
    if (this.isContentResuming()) {
      this.transitionTo(BeforePreroll);

    // Waiting for postroll to start. Content is considered playing
    // at this point, since it had to be playing to start the postroll.
    } else if (!this.inAdBreak()) {
      this.transitionTo(Preroll);
    }
  }

  /*
   * Wrap up if there is no postroll.
   */
  onNoPostroll(player) {
    if (!this.isContentResuming() && !this.inAdBreak()) {
      this.transitionTo(AdsDone);
    } else {
      videojs.log.warn('Unexpected nopostroll event (Postroll)');
    }
  }

  /*
   * Helper for ending Postrolls. In the future we may want to
   * refactor this class so that `cleanup` handles all of this.
   */
  abort() {
    const player = this.player;

    this.contentResuming = true;
    player.removeClass('vjs-ad-loading');

    player.ads.debug('Triggered ended event (postroll abort)');
    player.trigger('ended');
  }

  /*
   * Cleanup timeouts and state.
   */
  cleanup() {
    const player = this.player;

    player.clearTimeout(this._postrollTimeout);
    player.ads._contentEnding = false;
  }

}
