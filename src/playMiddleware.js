import videojs from 'video.js';

const obj = {};

/**
 * Checks if middleware mediators are available and
 * can be used on this platform.
 * Currently we can only use mediators on desktop platforms.
 */
obj.isMiddlewareMediatorSupported = function() {

  if (videojs.browser.IS_IOS || videojs.browser.IS_ANDROID) {
    return false;

  } else if (
    // added when middleware was introduced in video.js
    videojs.use &&
    // added when mediators were introduced in video.js
    videojs.middleware &&
    videojs.middleware.TERMINATOR) {
    return true;

  }

  return false;
};

obj.playMiddleware = function(player) {
  return {
    setSource(srcObj, next) {
      next(null, srcObj);
    },
    callPlay() {
      // Block play calls while waiting for an ad
      if (obj.isMiddlewareMediatorSupported() &&
          player.ads._shouldBlockPlay === true) {
        player.ads.debug('Using playMiddleware to block content playback');
        return videojs.middleware.TERMINATOR;
      }
    },
    play(terminated, value) {
      if (terminated) {
        player.ads.debug('Play call to Tech was terminated.');
        // Trigger play event to ensure that event order remains the same
        // as with cancelContentPlay.
        // The call to play on the Tech has been blocked, so triggering
        // the event on the Player will not affect the Tech's playback state.
        player.trigger('play');
      }
    }
  };
};

export default obj;
