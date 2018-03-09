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
  videojs.log('The play middleware is registered. Default terminate value',
    player.ads._shouldBlockPlay);

  return {
    setSource(srcObj, next) {
      next(null, srcObj);
    },
    callPlay() {
      videojs.log('TERMINATE', 'currently set to', player.ads._shouldBlockPlay);
      // Block play calls during ad mode
      if (obj.isMiddlewareMediatorSupported() &&
          player.ads._shouldBlockPlay === true) {
        return videojs.middleware.TERMINATOR;
      }
    },
    play(terminated, value) {
      if (terminated) {
        player.ads.debug('Play event was terminated.');
        player.trigger('play');
      }

      // TODO: should we handle the play promise here?
    }
  };
};

export default obj;
