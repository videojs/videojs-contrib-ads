import videojs from 'video.js';

const playMiddleware = function(player) {
  videojs.log('The play middleware is registered');

  return {
    setSource(srcObj, next) {
      next(null, srcObj);
    }
  };
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

export { playMiddleware, isMiddlewareMediatorSupported };
