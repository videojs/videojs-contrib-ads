import {ContentState} from './States.js';

export default class AdsDone extends ContentState {

  constructor(player) {
    super(player);

    // From now on, `ended` events won't be redispatched
    player.ads._contentHasEnded = true;
  }

}
