import States from '../states.js';

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

  endLinearAdMode() {
    const OutstreamDone = States.getState('OutstreamDone');

    this.transitionTo(OutstreamDone);
  }

}

States.registerState('OutstreamPlayback', OutstreamPlayback);

export default OutstreamPlayback;
