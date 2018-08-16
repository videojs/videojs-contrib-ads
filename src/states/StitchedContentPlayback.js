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
  init() {

    // Don't block calls to play in stitched ad players, ever.
    this.player.ads._shouldBlockPlay = false;
  }

  /*
   * Source change does not do anything for stitched ad players.
   * contentchanged does not fire during ad breaks, so we don't need to
   * worry about that.
   */
  onContentChanged() {
    this.player.ads.debug(`Received contentchanged event (${this._getName()})`);
  }

  /*
   * This is how stitched ads start.
   */
  startLinearAdMode() {
    this.transitionTo(StitchedAdRoll);
  }
}
