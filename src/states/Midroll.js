import {AdState} from '../states.js';
import adBreak from '../adBreak.js';

export default class Midroll extends AdState {

  /*
   * Midroll breaks happen when the integration calls startLinearAdMode,
   * which can happen at any time during content playback.
   */
  init(player) {
    player.ads.adType = 'midroll';
    adBreak.start(player);
  }

  /*
   * Midroll break is done.
   */
  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      this.contentResuming = true;
      adBreak.end(player);
    }
  }

  /*
   * End midroll break if there is an error.
   */
  onAdsError(player) {
    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (this.inAdBreak()) {
      player.ads.endLinearAdMode();
    }
  }

}
