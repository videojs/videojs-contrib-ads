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

  init() {}

  handleAdsReady() {
    this.adsReady = true;
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

      adBreak.end(this.player);
      this.transitionTo(OutstreamDone);
    }
  }

  // is skipping an ad an option???

  skipLinearAdMode() {
    // TODO
  }

}

States.registerState('OutstreamPlayback', OutstreamPlayback);

export default OutstreamPlayback;
