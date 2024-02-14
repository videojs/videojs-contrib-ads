import videojs from 'video.js';
import States from '../states.js';

const AdState = States.getState('AdState');

/**
 * this state is for when the outstream ad is completed (no content plays in an outstream player)
 */
class OutstreamDone extends AdState {

  /**
   * Allows state name to be logged after minification
   */
  static _getName() {
    return 'OutstreamDone';
  }

  init() {}

  /*
   * Midrolls do not play after ads are done.
   */
  startLinearAdMode() {
    videojs.log.warn('Unexpected startLinearAdMode invocation (OutstreamDone)');
  }
}

States.registerState('OutstreamDone', OutstreamDone);

export default OutstreamDone;
