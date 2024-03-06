import videojs from 'video.js';
import States from '../states.js';
import adBreak from '../adBreak.js';

const AdState = States.getState('AdState');

/**
 * This state is for waiting for ads in an outstream player,
 * playing ads, and transitioning to OutstreamDone after ads have played.
 */
class OutstreamPlayback extends AdState {

  /**
   * Allows state name to be logged after minification
   */
  static _getName() {
    return 'OutstreamPlayback';
  }

  /*
   * For state transitions to work correctly, initialization should
   * happen here, not in a constructor.
   */
  init(player, adsReady) {
    player.addClass('vjs-ad-loading');

    if (adsReady) {
      this.handleAdsReady();
    } else {
      this.abort(player);
    }
  }

  onAdsReady(player) {
    if (!player.ads.inAdBreak()) {
      player.ads.debug('Received adsready event (Preroll)');
      this.handleAdsReady();
    } else {
      videojs.log.warn('Unexpected adsready event (Preroll)');
    }
  }

  abort(player) {
    const OutstreamDone = States.getState('OutstreamDone');

    player.removeClass('vjs-ad-loading');
    this.transitionTo(OutstreamDone);
  }

  /*
   * An ad has actually started playing.
   * Remove the loading spinner.
   */
  onAdStarted(player) {
    player.removeClass('vjs-ad-loading');
  }

  handleAdsReady() {
    this.adsReady = true;
    this.readyForOutstreamPlayback();
  }

  readyForOutstreamPlayback() {
    const player = this.player;

    this.afterLoadStart(() => {
      // TODO - trigger another event (ie) readyforoutstreamad
      player.trigger('readyforpreroll');
    });
  }

  startLinearAdMode() {
    const player = this.player;

    if (this.adsReady && !player.ads.inAdBreak()) {
      adBreak.start(player);
    }

  }

  onAdStarted(player) {
    player.removeClass('vjs-ad-loading');
  }

  /*
   * An ad error occured. Transition straight to OutstreamDone
   */
  onAdsError(player) {
    videojs.log('adserror (OutstreamPlayback)');
    if (this.inAdBreak()) {
      player.ads.endLinearAdMode();
    } else {
      this.afterLoadStart(() => {
        this.abort(player);
      });
    }
  }

  /*
   * Outstream ad took too long! Play content instead.
   */
  onAdTimeout(player) {
    this.afterLoadStart(() => {
      player.ads.debug('adtimeout (OutstreamPlayback)');
      this.abort(player);
    });
  }

  onAdsCanceled(player) {
    player.ads.debug('adscanceled (OutstreamPlaybac)');

    this.afterLoadStart(() => {
      this.abort(player);
    });
  }

  endLinearAdMode() {
    if (this.inAdBreak()) {
      this.player.removeClass('vjs-ad-loading');

      const OutstreamDone = States.getState('OutstreamDone');

      adBreak.end(this.player, () => {
        this.transitionTo(OutstreamDone);
      });
    }
  }

  afterLoadStart(callback) {
    const player = this.player;

    if (player.ads._hasThereBeenALoadStartDuringPlayerLife) {
      callback();
    } else {
      player.ads.debug('Waiting for loadstart...');
      player.one('loadstart', () => {
        player.ads.debug('Received loadstart event');
        callback();
      });
    }
  }

  /**
   * Ad plugin has skipped ad - transition to OutstreamDone
   */
  skipLinearAdMode() {
    const player = this.player;
    const OutstreamDone = States.getState('OutstreamDone');

    if (this.inAdBreak()) {
      videojs.log.warn('Unexpected skipLinearAdMode invocation');
    } else {
      this.afterLoadStart(() => {
        player.trigger('adskip');
        player.ads.debug('skipLinearAdMode (OutstreamPlayback)');

        this.transitionTo(OutstreamDone);
      });
    }
  }
}

States.registerState('OutstreamPlayback', OutstreamPlayback);

export default OutstreamPlayback;
