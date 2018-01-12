import videojs from 'video.js';

import * as snapshot from '../snapshot.js';
import {AdState} from './RenameMe.js';

export default class Postroll extends AdState {

  constructor(player) {
    super(player);
    this.name = 'Postroll';
    this.adType = 'postroll';

    videojs.log('Now in ' + this.name + ' state');

    // From now on, all playing events will be redispatched
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

  onAdSkip() {
    videojs.log('Postroll abort (adskip)');
    this.abort();
  }

  onAdTimeout() {
    videojs.log('Postroll abort (adtimeout)');
    this.abort();
  }

  onAdsError() {
    videojs.log('Postroll abort (adserror)');
    this.abort();
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
