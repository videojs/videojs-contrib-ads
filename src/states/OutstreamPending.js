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
    this.shouldResumeToContent = false;
  }

  // todo...
  onPlay(player) {
    const OutstreamPlayback = States.getState('OutstreamPlayback');
    const OutstreamDone = States.getState('OutstreamDone');

    player.ads.debug('Received play event (OutstreamPending)');
    if (this.adsReady) {
      this.transitionTo(OutstreamPlayback, this.adsReady, this.shouldResumeToContent);
    } else {
      this.transitionTo(OutstreamDone);
    }
  }

  onAdsReady(player) {
    player.ads.debug('Received adsready event (OutstreamPending)');
    this.adsReady = true;
  }

  // when an ad fails -> we should transition straight to AdsDone
  onAdsError() {
    this.player.ads.debug('adserror (OutstreamPending)');
    this.adsReady = false;
    //  transition to AdsDone
  }
}

States.registerState('OutstreamPending', OutstreamPending);

export default OutstreamPending;
