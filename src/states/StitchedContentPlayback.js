import {ContentState, StitchedAdRoll} from '../states.js';

/*
 * This state represents content playback when stitched ads are in play.
 */
export default class StitchedContentPlayback extends ContentState {

  /*
   * Allows state name to be logged even after minification.
   */
  static _getName() {
    return 'StitchedContentPlayback';
  }

  /*
   * For state transitions to work correctly, initialization should
   * happen here, not in a constructor.
   */
  init(player) {

    // Don't block calls to play in stitched ad players, ever.
    player.ads._shouldBlockPlay = false;

    // Tell redispatch not to intercept ended events. This should prevent
    // the firing of readyforpostroll.
    player.ads._contentHasEnded = true;
  }

  /*
   * Source change does not do anything for stitched ad players.
   * contentchanged does not fire during ad breaks, so we don't need to
   * worry about that.
   */
  onContentChanged(player) {
    player.ads.debug(`Received contentchanged event (${this._getName()})`);
  }

  /*
   * This is how stitched ads start.
   */
  startLinearAdMode() {
    this.transitionTo(StitchedAdRoll);
  }
}
