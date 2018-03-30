import videojs from 'video.js';
import pm from './playMiddleware.js';

export default function initCancelContentPlay(player, debug) {
  if (pm.isMiddlewareMediatorSupported()) {
    // Don't use cancelContentPlay while playMiddleware is in use
    return;
  }

  if (debug) {
    videojs.log('ADS:', 'Using cancelContentPlay to block content playback');
  }

  // Listen to play events to "cancel" them afterward
  player.on('play', cancelContentPlay);
}

/*
This feature makes sure the player is paused during ad loading.

It does this by pausing the player immediately after a "play" where ads will be requested,
then signalling that we should play after the ad is done.
*/

function cancelContentPlay() {
  const player = this;

  if (player.ads._shouldBlockPlay === false) {
    // Only block play if the ad plugin is in a state when content
    // playback should be blocked. This currently means during
    // BeforePrerollState and PrerollState.
    return;
  }

  // pause playback so ads can be handled.
  if (!player.paused()) {
    player.ads.debug('Play event was canceled');
    player.pause();
  }

  // When the 'content-playback' state is entered, this will let us know to play.
  // This is needed if there is no preroll or if it errors, times out, etc.
  player.ads._cancelledPlay = true;
}

/**
 * TODO:
 *
 * [x] Make cancelContentPlay self-sufficient.
 * [x] Handle play events in this file.
 * Alternatives:
 * - add another flag for "between init and starting preroll ad break"
 * - have a 3 value flag "cancelContentPlay" "middleware" "don't block"
 *
 */
