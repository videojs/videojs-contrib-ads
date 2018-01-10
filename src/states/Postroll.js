import videojs from 'video.js';

import * as snapshot from '../snapshot.js';
import {AdState, AdsDone} from './RenameMe.js';

export default class Postroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Postroll';
    this.adType = 'postroll';

    videojs.log('Now in ' + this.name + ' state');

    player.ads._contentEnding = true;
    player.ads.snapshot = snapshot.getPlayerSnapshot(player);
    if (player.ads.nopostroll_) {
      player.setTimeout(() => {
        videojs.log('Triggered ended event (no postroll)');
        this.contentResuming = true;
        player.trigger('ended');
        player.ads.stateInstance = new AdsDone(player);
      }, 1);
    } else {
      player.addClass('vjs-ad-loading');

      player.ads.adTimeoutTimeout = player.setTimeout(function() {
        player.trigger('adtimeout');
      }, player.ads.settings.postrollTimeout);
    }
  }

  onAdsError() {
    // TODO Why?
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

  onAdSkip() {
    const player = this.player;

    this.contentResuming = true;
    player.clearTimeout(player.ads.adTimeoutTimeout);
    player.removeClass('vjs-ad-loading');
    player.setTimeout(function() {
      videojs.log('Triggered ended event (adskip)');
      player.trigger('ended');
      player.ads.stateInstance = new AdsDone(player);
    }, 1);
  }

  onAdTimeout() {
    const player = this.player;

    this.contentResuming = true;
    player.clearTimeout(player.ads.adTimeoutTimeout);
    player.removeClass('vjs-ad-loading');
    player.setTimeout(function() {
      videojs.log('Triggered ended event (adtimeout)');
      player.trigger('ended');
      player.ads.stateInstance = new AdsDone(player);
    }, 1);
  }

  onAdsError() {
    const player = this.player;

    this.contentResuming = true;
    player.clearTimeout(player.ads.adTimeoutTimeout);
    player.removeClass('vjs-ad-loading');
    player.setTimeout(function() {
      videojs.log('Triggered ended event (adserror)');
      player.trigger('ended');
      player.ads.stateInstance = new AdsDone(player);
    }, 1);
  }

}
