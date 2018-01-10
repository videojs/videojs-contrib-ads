import videojs from 'video.js';

import {AdState} from './RenameMe.js';

export default class Midroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Midroll';
    this.adType = 'midroll';

    videojs.log('Now in ' + this.name + ' state');
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

  // TODO update me to not use the old state machine
  isContentResuming() {
    return this.player.ads.state === 'content-resuming';
  }

}
