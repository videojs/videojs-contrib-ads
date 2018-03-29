import {ContentState, Midroll, Postroll} from '../states.js';

/*
 * This state represents content playback the first time through before
 * content ends. After content has ended once, we check for postrolls and
 * move on to the AdsDone state rather than returning here.
 */
export default class ContentPlayback extends ContentState {

  /*
   * Allows state name to be logged even after minification.
   */
  static _getName() {
    return 'ContentPlayback';
  }

  /*
   * For state transitions to work correctly, initialization should
   * happen here, not in a constructor.
   */
  init(player) {
    // Don't block calls to play in content playback
    player.ads._shouldBlockPlay = false;

    // Play the content if we had requested play or we paused on 'contentupdate'
    // and we haven't played yet. This happens if there was no preroll or if it
    // errored, timed out, etc. Otherwise snapshot restore would play.
    // if (player.paused() &&
    //     (player.ads._playRequested || player.ads._pausedOnContentupdate)) {
    //   // eslint-disable-next-line no-console
    //   console.log('**** replaying the player');
    //   player.play();
    // }
  }

  /*
   * In the case of a timeout, adsready might come in late. This assumes the behavior
   * that if an ad times out, it could still interrupt the content and start playing.
   * An integration could behave otherwise by ignoring this event.
   */
  onAdsReady(player) {
    player.ads.debug('Received adsready event (ContentPlayback)');

    if (!player.ads.nopreroll_) {
      player.ads.debug('Triggered readyforpreroll event (ContentPlayback)');
      player.trigger('readyforpreroll');
    }
  }

  /*
   * Content ended before postroll checks.
   */
  onContentEnded(player) {
    player.ads.debug('Received contentended event');
    this.transitionTo(Postroll);
  }

  /*
   * This is how midrolls start.
   */
  startLinearAdMode() {
    this.transitionTo(Midroll);
  }

}
