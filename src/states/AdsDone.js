import videojs from 'video.js';

import {ContentState} from './RenameMe.js';

export default class AdsDone extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'AdsDone';
    videojs.log(this.name);
  }

}
