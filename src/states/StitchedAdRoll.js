import {AdState, StitchedContentPlayback} from '../states.js';
import adBreak from '../adBreak.js';

export default class StitchedAdRoll extends AdState {

  /*
   * Allows state name to be logged even after minification.
   */
  static _getName() {
    return 'StitchedAdRoll';
  }

  /*
   * StitchedAdRoll breaks happen when the ad plugin calls startLinearAdMode,
   * which can happen at any time during content playback.
   */
  init(player) {
    this.waitingForAdBreak = false;
    this.contentResuming = false;
    player.ads.adType = 'stitched';
    adBreak.start(player);
  }

  /*
   * For stitched ads, there is no "content resuming" scenario, so a "playing"
   * event is not relevant.
   */
  onPlaying() {}

  /*
   * For stitched ads, there is no "content resuming" scenario, so a
   * "contentresumed" event is not relevant.
   */
  onContentResumed() {}

  /*
   * StitchedAdRoll break is done.
   */
  endLinearAdMode() {
    adBreak.end(this.player);
    this.transitionTo(StitchedContentPlayback);
  }
}
