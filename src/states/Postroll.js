import videojs from 'video.js';

import AdState from './abstract/AdState.js';

export default class Postroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Postroll';
    this.adType = 'postroll';
    videojs.log(this.name);
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
