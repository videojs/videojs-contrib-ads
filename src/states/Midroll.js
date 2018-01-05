import AdState from './abstract/AdState.js';

export default class Midroll extends AdState {

  constructor() {
    super();
    this.adType = 'midroll';
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
