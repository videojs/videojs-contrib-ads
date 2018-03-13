import pm from './playMiddleware.js';

/*
This feature makes sure the player is paused during ad loading.

It does this by pausing the player immediately after a "play" where ads will be requested,
then signalling that we should play after the ad is done.
*/

export default function cancelContentPlay(player) {
  if (pm.isMiddlewareMediatorSupported()) {
    // Don't use cancelContentPlay while playMiddleware is in use
    return;
  } else if (player.ads.cancelPlayTimeout) {
    // another cancellation is already in flight, so do nothing
    return;
  }

  player.ads.debug('Using cancelContentPlay to block content playback');

  // The timeout is necessary because pausing a video element while processing a `play`
  // event on iOS can cause the video element to continuously toggle between playing and
  // paused states.
  player.ads.cancelPlayTimeout = player.setTimeout(function() {
    // deregister the cancel timeout so subsequent cancels are scheduled
    player.ads.cancelPlayTimeout = null;

    if (!player.ads.isInAdMode()) {
      return;
    }

    // pause playback so ads can be handled.
    if (!player.paused()) {
      player.pause();
    }

    // When the 'content-playback' state is entered, this will let us know to play.
    // This is needed if there is no preroll or if it errors, times out, etc.
    player.ads._cancelledPlay = true;
  }, 1);
}
