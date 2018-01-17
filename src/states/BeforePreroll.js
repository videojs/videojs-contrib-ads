import videojs from 'video.js';

import {ContentState, Preroll, ContentPlayback} from './RenameMe.js';
import cancelContentPlay from '../cancelContentPlay.js';

/*
 * This is the initial state for a player with an ad plugin. Normally, it remains in this
 * state until a "play" event is seen. After that, we enter the Preroll state to check for
 * prerolls. This happens regardless of whether or not any prerolls ultimately play.
 * Errors and other conditions may lead us directly from here to ContentPlayback.
 */
export default class BeforePreroll extends ContentState {

  constructor(player) {
    super(player);
    this.name = 'BeforePreroll';
    this.adsReady = false;

    videojs.log('Now in ' + this.name + ' state');
  }

  /*
   * The integration may trigger adsready before the play request. If so,
   * we record that adsready already happened so the Preroll state will know.
   */
  onAdsReady() {
    videojs.log('Received adsready event');
    this.adsReady = true;
  }

  /*
   * Ad mode officially begins on the play request, because at this point
   * content playback is blocked by the ad plugin.
   */
  onPlay() {
    const player = this.player;

    cancelContentPlay(player);

    this.player.ads.stateInstance = new Preroll(player, this.adsReady);

    // This removes the poster so it doesn't flash between videos.
    // TODO This is only invoked if adsReady is false to match the pre-refactor
    // implementation. We should investigate if that is necessary.
    if (this.adsReady === false) {
      player.ads.removeNativePoster();
    }
  }

  /*
   * TODO The adscanceled event seems to be redundant. We should consider removing it.
   * skipLinearAdMode does the same thing, but in a more robust way.
   */
  onAdsCanceled() {
    // TODO the check for adsReady is only to match the pre-refactor behavior.
    // It is probably unnecessary at best, a bug at worst. It should be investigated
    // and hopefully removed.
    if (this.adsReady === false) {
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  /*
   * An ad error occured. Play content instead.
   */
  onAdsError() {
    this.player.ads.stateInstance = new ContentPlayback(this.player);
  }

  /*
   * Ad mode skipped by integration. Play content instead.
   */
  skipLinearAdMode() {
    const player = this.player;

    player.trigger('adskip');
    player.ads.stateInstance = new ContentPlayback(player);
  }

}
