import videojs from 'video.js';

import {ContentState, Midroll, Postroll} from '../states.js';

/*
 * This state represents content playback the first time through before
 * content ends. After content has ended once, we check for postrolls and
 * move on to the AdsDone state rather than returning here.
 */
export default class ContentPlayback extends ContentState {

  init(player) {
    // Deprecated event.
    player.trigger({
      type: 'contentplayback',
      triggerevent: player.ads.triggerevent
    });

    // Play the content if cancelContentPlay happened and we haven't played yet.
    // This happens if there was no preroll or if it errored, timed out, etc.
    // Otherwise snapshot restore would play.
    if (player.paused() && player.ads._cancelledPlay) {
      player.play();
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
      videojs.log('Triggered readyforpreroll event (ContentPlayback)');
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
    this.transitionTo(Midroll);
  }

}
