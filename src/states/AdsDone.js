import videojs from 'video.js';

import ContentState from './abstract/ContentState.js';

export default class AdsDone extends ContentState {

  constructor() {
    super();
    this.name = 'AdsDone';
    videojs.log(this.name);
  }

}
