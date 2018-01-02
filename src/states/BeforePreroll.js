import ContentState from './abstract/ContentState.js';
import Preroll from './Preroll.js';

export default class BeforePreroll extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'BeforePreroll';
    this.adsReady = false;
  }

  /*
   * The integration may trigger adsready before the play request. If so,
   * remember this information so we can get going when the play request
   * comes in.
   */
  onAdsReady() {
    this.adsReady = true;
  }

  /*
   * Ad mode officially begins on the play request, because at this point
   * content playback is officially blocked by the ad plugin.
   */
  onPlay() {
    this.player.ads.stateInstance = new Preroll(this.player, this.adsReady);
  }

}
