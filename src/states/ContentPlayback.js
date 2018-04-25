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
  }

  /*
   * In the case of a timeout, adsready might come in late. This assumes the behavior
   * that if an ad times out, it could still interrupt the content and start playing.
   * An ad plugin could behave otherwise by ignoring this event.
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
  onReadyForPostroll(player) {
    player.ads.debug('Received readyforpostroll event');
    this.transitionTo(Postroll);
  }

  /*
   * This is how midrolls start.
   */
  startLinearAdMode() {
    this.transitionTo(Midroll);
  }

}
