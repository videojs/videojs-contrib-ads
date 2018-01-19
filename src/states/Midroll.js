import videojs from 'video.js';

import {AdState} from './RenameMe.js';
import AdBreak from '../AdBreak.js';

export default class Midroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Midroll';

    videojs.log('Now in Midroll state');
  }

  startLinearAdMode() {
    const player = this.player;

    if (!player.ads.isAdPlaying() && !this.isContentResuming()) {
      player.ads.adType = 'midroll';
      this.adBreak = new AdBreak(player);
      this.adBreak.start();
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  endLinearAdMode() {
    if (this.adBreak) {
      this.adBreak.end();
      delete this.adBreak;
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
