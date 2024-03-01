import videojs from 'video.js';
import States from '../states.js';
import adBreak from '../adBreak.js';

const AdState = States.getState('AdState');

/**
 * this state is for the outstream ad playing
 */
class OutstreamPlayback extends AdState {

  /**
   * Allows state name to be logged after minification
   */
  static _getName() {
    return 'OutstreamPlayback';
  }

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
      // TODO - trigger another event readyforoutstreamad
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

  // is skipping an ad an option???

  skipLinearAdMode() {
  }

}

States.registerState('OutstreamPlayback', OutstreamPlayback);

export default OutstreamPlayback;
