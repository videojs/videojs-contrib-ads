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
  init() {
    this.waitingForAdBreak = false;
    this.contentResuming = false;
    this.player.ads.adType = 'stitched';
    adBreak.start(this.player);
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
   * When we see an "adended" event, it means that we are in a postroll that
   * has ended (because the media ended and we are still in an ad state).
   *
   * In these cases, we transition back to content mode and fire ended.
   */
  onAdEnded() {
    this.endLinearAdMode();
    this.player.trigger('ended');
  }

  /*
   * StitchedAdRoll break is done.
   */
  endLinearAdMode() {
    adBreak.end(this.player);
    this.transitionTo(StitchedContentPlayback);
  }
}
