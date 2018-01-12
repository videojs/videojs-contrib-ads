import videojs from 'video.js';

import {AdState} from './RenameMe.js';
import AdBreak from '../AdBreak.js';

export default class Midroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Midroll';

    videojs.log('Now in ' + this.name + ' state');
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
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

}
