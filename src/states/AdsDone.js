import videojs from 'video.js';

import {ContentState} from './RenameMe.js';

export default class AdsDone extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'AdsDone';

    videojs.log('Now in AdsDone state');

    // From now on, `ended` events won't be redispatched
    player.ads._contentHasEnded = true;
  }

}
