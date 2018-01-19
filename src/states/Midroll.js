import videojs from 'video.js';

import {AdState} from './States.js';
import {startAdBreak, endAdBreak} from '../adBreak.js';

export default class Midroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Midroll';

    videojs.log('Now in Midroll state');
  }

  startLinearAdMode() {
    const player = this.player;

    if (!this.inAdBreak() && !this.isContentResuming()) {
      player.ads.adType = 'midroll';
      startAdBreak(player);
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      endAdBreak(player);
      this.contentResuming = true;
    }
  }

  onAdsError() {
    // In the future, we may not want to do this automatically.
    // Integrations should be able to choose to continue the ad break
    // if there was an error.
    if (this.inAdBreak()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
