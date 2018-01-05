import AdState from './abstract/AdState.js';

export default class Postroll extends AdState {

  constructor() {
    super();
    this.adType = 'postroll';
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
