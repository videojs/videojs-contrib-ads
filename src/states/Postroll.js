import videojs from 'video.js';

import * as snapshot from '../snapshot.js';
import {AdState, AdsDone} from './RenameMe.js';
import AdBreak from '../AdBreak.js';

export default class Postroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Postroll';

    videojs.log('Now in ' + this.name + ' state');

    // From now on, all `playing` events will be redispatched
    player.ads._contentEnding = true;

    // TODO We should not need to take a snapshot here
    player.ads.snapshot = snapshot.getPlayerSnapshot(player);

    // Start postroll process. A postroll will start if the integration calls
    // startLinearAdMode. It's also possible the ad will time out, error, etc.
    if (!player.ads.nopostroll_) {
      player.addClass('vjs-ad-loading');

      player.ads.adTimeoutTimeout = player.setTimeout(function() {
        player.trigger('adtimeout');
      }, player.ads.settings.postrollTimeout);

    // No postroll, ads are done
    } else {
      player.setTimeout(() => {
        videojs.log('Triggered ended event (no postroll)');
        this.contentResuming = true;
        player.trigger('ended');
      }, 1);
    }
  }

  onAdsError() {
    // Ideally, ad integrations would call endLinearAdMode if there is an error.
    // Historically we have not required this, so for adserror only
    // we call endLinearAdMode in contrib-ads.
    if (this.player.ads.isAdPlaying()) {
      this.player.ads.endLinearAdMode();
    }
  }

  startLinearAdMode() {
    const player = this.player;

    if (!player.ads.isAdPlaying() && !this.contentResuming) {
      player.ads.adType = 'postroll';
      this.adBreak = new AdBreak(player);
      this.adBreak.start();
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  endLinearAdMode() {
    const player = this.player;

    if (this.adBreak) {
      this.adBreak.end();
      delete this.adBreak;

      this.contentResuming = true;

      videojs.log('Triggered ended event (endLinearAdMode)');
      player.trigger('ended');
    }
  }

  skipLinearAdMode() {
    const player = this.player;

    if (player.ads.isAdPlaying() || this.isContentResuming()) {
      videojs.log('Unexpected skipLinearAdMode invocation');
    } else {
      videojs.log('Postroll abort (skipLinearAdMode)');
      player.trigger('adskip');
      this.abort();
    }
  }

  onAdTimeout() {
    videojs.log('Postroll abort (adtimeout)');
    this.abort();
  }

  onAdsError() {
    videojs.log('Postroll abort (adserror)');
    this.abort();
  }

  onEnded() {
    if (this.contentResuming) {
      this.player.ads.stateInstance = new AdsDone(this.player);
    } else {
      videojs.log('Unexpected ended event during postroll');
    }
  }

  abort() {
    const player = this.player;

    this.contentResuming = true;
    player.clearTimeout(player.ads.adTimeoutTimeout);
    player.removeClass('vjs-ad-loading');

    // TODO document why this timeout is here
    player.setTimeout(function() {
      videojs.log('Triggered ended event (postroll abort)');
      player.trigger('ended');
    }, 1);
  }

}
