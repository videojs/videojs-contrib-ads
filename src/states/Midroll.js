import videojs from 'video.js';

import {AdState} from '../states.js';
import {startAdBreak, endAdBreak} from '../adBreak.js';

export default class Midroll extends AdState {

  init(player) {
    this.start();
  }

  /*
   * Midroll breaks happen when the integration calls startLinearAdMode,
   * which can happen at any time during content playback.
   */
  start() {
    const player = this.player;

    if (!this.inAdBreak() && !this.isContentResuming()) {
      player.ads.adType = 'midroll';
      startAdBreak(player);
    } else {
      videojs.log('Unexpected startLinearAdMode invocation (Midroll)');
    }
  }

  /*
   * Midroll break is done.
   */
  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      endAdBreak(player);
      this.contentResuming = true;
    }
  }

  /*
   * End midroll break if there is an error.
   */
  onAdsError() {
    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (this.inAdBreak()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
