/*
This feature makes sure the player is paused during ad loading.

It does this by pausing the player immediately after a "play" where ads will be requested,
then signalling that we should play after the ad is done.
*/

import window from 'global/window';
import document from 'global/document';

import videojs from 'video.js';

export default function cancelContentPlay(player) {
  if (player.ads.cancelPlayTimeout) {
    // another cancellation is already in flight, so do nothing
    return;
  }

  // Avoid content flash on non-iPad iOS and iPhones on iOS10 with playsinline
  if ((videojs.browser.IS_IOS && videojs.browser.IS_IPHONE) &&
      !player.el_.hasAttribute('playsinline')) {

    // The placeholder's styling should match the player's
    const width = player.currentWidth ? player.currentWidth() : player.width();
    const height = player.currentHeight ? player.currentHeight() : player.height();
    const position = window.getComputedStyle(player.el_).position;
    const top = window.getComputedStyle(player.el_).top;

    // A placeholder black box will be shown in the document while the player is hidden.
    const placeholder = document.createElement('div');

    placeholder.style.width = width + 'px';
    placeholder.style.height = height + 'px';
    placeholder.style.background = 'black';
    placeholder.style.position = position;
    placeholder.style.top = top;
    player.el_.parentNode.insertBefore(placeholder, player.el_);

    // Hide the player. While in full-screen video playback mode on iOS, this
    // makes the player show a black screen instead of content flash.
    player.el_.style.display = 'none';

    // Unhide the player and remove the placeholder once we're ready to move on.
    player.one(['adstart', 'adtimeout', 'adserror', 'adscanceled', 'adskip',
                'playing'], function() {
      player.el_.style.display = 'block';
      placeholder.remove();
    });

    // Detect fullscreen change, if returning from fullscreen and placeholder exists,
    // remove placeholder and show player whether or not playsinline was attached.
    player.on('fullscreenchange', function() {
      if (placeholder && !player.isFullscreen()) {
        player.el_.style.display = 'block';
        placeholder.remove();
      }
    });

  }

  // The timeout is necessary because pausing a video element while processing a `play`
  // event on iOS can cause the video element to continuously toggle between playing and
  // paused states.
  player.ads.cancelPlayTimeout = window.setTimeout(function() {
    // deregister the cancel timeout so subsequent cancels are scheduled
    player.ads.cancelPlayTimeout = null;

    // pause playback so ads can be handled.
    if (!player.paused()) {
      player.pause();
    }

    // When the 'content-playback' state is entered, this will let us know to play.
    // This is needed if there is no preroll or if it errors, times out, etc.
    player.ads._cancelledPlay = true;
  }, 1);
}
