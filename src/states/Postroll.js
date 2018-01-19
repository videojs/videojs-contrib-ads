import videojs from 'video.js';

import {AdState, BeforePreroll, Preroll, AdsDone} from './States.js';
import {startAdBreak, endAdBreak} from '../adBreak.js';

export default class Postroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Postroll';

    videojs.log('Now in Postroll state');

    // From now on, all `playing` events will be redispatched
    player.ads._contentEnding = true;

    // Start postroll process. A postroll will start if the integration calls
    // startLinearAdMode. It's also possible the ad will time out, error, etc.
    if (!player.ads.nopostroll_) {
      player.addClass('vjs-ad-loading');

      this._postrollTimeout = player.setTimeout(function() {
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
    if (this.player.ads.inAdBreak()) {
      this.player.ads.endLinearAdMode();
    }
  }

  startLinearAdMode() {
    const player = this.player;

    if (!player.ads.isAdPlaying() && !this.contentResuming) {
      player.ads.adType = 'postroll';
      player.clearTimeout(this._postrollTimeout);
      startAdBreak(player);
    } else {
      videojs.log('Unexpected startLinearAdMode invocation');
    }
  }

  onAdStarted() {
    const player = this.player;

    player.removeClass('vjs-ad-loading');
  }

  endLinearAdMode() {
    const player = this.player;

    if (this.inAdBreak()) {
      player.removeClass('vjs-ad-loading');
      endAdBreak(player);

      this.contentResuming = true;

      videojs.log('Triggered ended event (endLinearAdMode)');
      player.trigger('ended');
    }
  }

  skipLinearAdMode() {
    const player = this.player;

    if (player.ads.inAdBreak() || this.isContentResuming()) {
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
      this.transitionTo(AdsDone);
    } else {
      videojs.log('Unexpected ended event during postroll');
    }
  }

  onContentUpdate() {
    if (this.contentResuming) {
      this.transitionTo(BeforePreroll);
    } else if (!this.player.ads._inLinearAdMode) {
      this.transitionTo(Preroll);
    }
  }

  abort() {
    const player = this.player;

    this.contentResuming = true;
    player.removeClass('vjs-ad-loading');

    videojs.log('Triggered ended event (postroll abort)');
    player.trigger('ended');
  }

  cleanup() {
    const player = this.player;

    player.clearTimeout(this._postrollTimeout);
  }

}
