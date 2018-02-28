import videojs from 'video-js';

export default function playMiddleware(player) {
  videojs.log('The play middleware is registered');

  return {
    setSource(srcObj, next) {
      next(null, srcObj);
    }
  };
}
