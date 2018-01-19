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

    videojs.log('Now in BeforePreroll state');
  }

  /*
   * The integration may trigger adsready before the play request. If so,
   * we record that adsready already happened so the Preroll state will know.
   */
  onAdsReady() {
    videojs.log('Received adsready event (BeforePreroll)');
    this.adsReady = true;
  }

  /*
   * Ad mode officially begins on the play request, because at this point
   * content playback is blocked by the ad plugin.
   */
  onPlay() {
    const player = this.player;

    // Don't start content playback yet
    cancelContentPlay(player);

    // Check for prerolls
    this.transitionTo(Preroll, this.adsReady);
  }

  /*
   * All ads for the entire video are canceled
   */
  onAdsCanceled() {
    videojs.log('adscanceled (BeforePreroll)');

    this.transitionTo(ContentPlayback);
  }

  /*
   * An ad error occured. Play content instead.
   */
  onAdsError() {
    this.transitionTo(ContentPlayback);
  }

  /*
   * Ad mode skipped by integration. Play content instead.
   */
  skipLinearAdMode() {
    const player = this.player;

    player.trigger('adskip');
    this.transitionTo(ContentPlayback);
  }

  onContentUpdate() {
    videojs.log('Ignoring contentupdate before preroll');
  }

}
