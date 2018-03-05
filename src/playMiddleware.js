import videojs from 'video.js';

const playMiddleware = function(player) {
  videojs.log('The play middleware is registered. Default terminate value',
    player.ads._playMiddleware.shouldTerminate);

  return {
    setSource(srcObj, next) {
      next(null, srcObj);
    },
    callPlay() {
      // Block play calls during ad mode
      if (player.ads._playMiddleware.shouldTerminate === true) {
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

const setTerminate = function(player, value) {
  videojs.log('TERMINATE', 'set to', value);
  player.ads._playMiddleware.shouldTerminate = value;
};

/**
 * Checks if middleware mediators are available and
 * can be used on this platform.
 * Currently we can only use mediators on desktop platforms.
 */
const isMiddlewareMediatorSupported = function() {

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

export { playMiddleware, isMiddlewareMediatorSupported, setTerminate };
