import videojs from 'video.js';

export default function initCancelContentPlay(player, debug) {
  if (debug) {
    videojs.log('Using cancelContentPlay to block content playback');
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
    player.ads.debug('Playback was canceled by cancelContentPlay');
    player.pause();
  }

  // When the 'content-playback' state is entered, this will let us know to play.
  // This is needed if there is no preroll or if it errors, times out, etc.
  player.ads._cancelledPlay = true;
}
