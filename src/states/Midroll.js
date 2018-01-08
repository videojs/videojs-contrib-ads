import videojs from 'video.js';

import AdState from './abstract/AdState.js';

export default class Midroll extends AdState {

  constructor() {
    super();
    this.name = 'Midroll';
    this.adType = 'midroll';
    videojs.log(this.name);
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
