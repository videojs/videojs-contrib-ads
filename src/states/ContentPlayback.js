import videojs from 'video.js';

import {ContentState, Midroll, Postroll} from './RenameMe.js';

export default class ContentPlayback extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'ContentPlayback';

    videojs.log('Now in ContentPlayback state');

    // The contentplayback event was removed because integrations should use the
    // "playing" event instead. However, we found out some 3rd party code relied
    // on this event, so we've temporarily added it back in to give people more
    // time to update their code.
    player.trigger({
      type: 'contentplayback',
      triggerevent: player.ads.triggerevent
    });

    // Play the content if cancelContentPlay happened and we haven't played yet.
    // This happens if there was no preroll or if it errored, timed out, etc.
    // Otherwise snapshot restore would play.
    if (player.ads._cancelledPlay) {
      if (player.paused()) {
        player.play();
      }
    }
  }

  /*
   * In the case of a timeout, adsready might come in late. This assumes the behavior
   * that if an ad times out, it could still interrupt the content and start playing.
   * An integration could behave otherwise by ignoring this event.
   */
  onAdsReady() {
    const player = this.player;

    videojs.log('Received adsready event during content playback');

    if (!player.ads.nopreroll_) {
      videojs.log('Triggered readyforpreroll event');
      player.trigger('readyforpreroll');
    }
  }

  /*
   * Content ended before postroll checks.
   */
  onContentEnded() {
    videojs.log('Received contentended event');
    this.transitionTo(Postroll);
  }

  /*
   * This is how midrolls start.
   */
  startLinearAdMode() {
    const player = this.player;

    this.transitionTo(Midroll);
    player.ads.stateInstance.startLinearAdMode();
  }

}
