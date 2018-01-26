import videojs from 'video.js';

import {ContentState} from '../states.js';

export default class AdsDone extends ContentState {

  init(player) {
    // From now on, `ended` events won't be redispatched
    player.ads._contentHasEnded = true;
  }

  /*
   * Midrolls do not play after ads are done.
   */
  startLinearAdMode() {
    videojs.log.warn('Unexpected startLinearAdMode invocation (AdsDone)');
  }

}
