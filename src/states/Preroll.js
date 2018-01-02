import AdState from './abstract/AdState.js';

export default class Preroll extends AdState {

  constructor(player, adsReady) {
    super(player);
    this.name = 'Preroll';
    if (adsReady) {
      this.onAdsReady();
    }
  }

  /*
   * Ad integration is ready. Let's get started on this preroll.
   */
  onAdsReady() {
    if (this.player.ads.nopreroll_) {
      this.noPreroll();
    } else {
      this.readyForPreroll();
    }
  }

  noPreroll() {
    const player = this.player;

    // This will start the ads manager in case there are later ads
    // TODO We need to refactor this, we can definitely solve the ads manager
    // issue in a more intuitive way.
    player.trigger('readyforpreroll');

    // If we don't wait a tick, entering content-playback will cancel
    // cancelPlayTimeout, causing the video to not pause for the ad
    // TODO A goal of the ad state refactor is to avoid this type of thing,
    // so we will revisit this.
    window.setTimeout(function() {
      // Don't wait for a preroll
      player.trigger('nopreroll');
    }, 1);
  }

  readyForPreroll() {
    const player = this.player;

    // Change class to show that we're waiting on ads
    player.addClass('vjs-ad-loading');

    // Schedule an adtimeout event to fire if we waited too long
    player.ads.adTimeoutTimeout = window.setTimeout(function() {
      player.trigger('adtimeout');
    }, player.ads.settings.prerollTimeout);

    // Signal to ad plugin that it's their opportunity to play a preroll
    if (player.ads._hasThereBeenALoadStartDuringPlayerLife) {
      player.trigger('readyforpreroll');

    // Don't play preroll before loadstart, otherwise the content loadstart event
    // will get misconstrued as an ad loadstart. This is only a concern for the
    // initial source; for source changes the whole ad process is kicked off by
    // loadstart so it has to have happened already.
    } else {
      player.one('loadstart', () => {
        player.trigger('readyforpreroll');
      });
    }
  }

}
