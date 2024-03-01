import States from '../states.js';

const AdState = States.getState('AdState');

/**
 * this is the initial outstream state flow
 */
// TODO: this._state is not defined?? how tf do i define it
class OutstreamPending extends AdState {

  /**
   * Allows state name to be logged after minification
   */
  static _getName() {
    return 'OutstreamPending';
  }

  init(player) {
    this.adsReady = false;
  }

  onPlay(player) {
    const OutstreamPlayback = States.getState('OutstreamPlayback');

    player.ads.debug('Received play event (OutstreamPending)');
    this.transitionTo(OutstreamPlayback, this.adsReady);
  }

  onAdsReady(player) {
    player.ads.debug('Received adsready event (OutstreamPending)');
    this.adsReady = true;
  }

  onAdsError() {
    this.player.ads.debug('adserror (OutstreamPending)');
    this.adsReady = false;
  }
}

States.registerState('OutstreamPending', OutstreamPending);

export default OutstreamPending;
