import videojs from 'video.js';
import playMiddlewareFeature from './playMiddleware.js';

const {playMiddleware, isMiddlewareMediatorSupported} = playMiddlewareFeature;

// The plugin name.
const NAME = 'ads';

/**
 * Whether or not this copy of Video.js has the ads plugin.
 *
 * @return {boolean}
 *         If `true`, has the plugin. `false` otherwise.
 */
const hasAdsPlugin = () => {
  if (videojs.getPlugin) {
    return Boolean(videojs.getPlugin(NAME));
  }

  const Player = videojs.getComponent('Player');

  return Boolean(Player && Player.prototype[NAME]);
};

/**
 * Register contrib-ads with Video.js, but provide protection for duplicate
 * copies of the plugin. This could happen if, for example, a stitched ads
 * plugin and a client-side ads plugin are included simultaneously with their
 * own copies of contrib-ads.
 *
 * If contrib-ads detects a pre-existing duplicate, it will not register
 * itself.
 *
 * Ad plugins using contrib-ads and anticipating that this could come into
 * effect should verify that the contrib-ads they are using is of a compatible
 * version.
 *
 * @param  {Function} contribAdsPlugin
 *         The plugin function.
 *
 * @return {boolean}
 *         When `true`, the plugin was registered. When `false`, the plugin
 *         was not registered.
 */
function register(contribAdsPlugin) {

  // If the ads plugin already exists, do not overwrite it.
  if (hasAdsPlugin(videojs)) {
    return false;
  }

  // Cross-compatibility with Video.js 6/7 and 5.
  const registerPlugin = videojs.registerPlugin || videojs.plugin;

  // Register this plugin with Video.js.
  registerPlugin(NAME, contribAdsPlugin);

  // Register the play middleware with Video.js on script execution,
  // to avoid a new playMiddleware factory being added for each player.
  // The `usingContribAdsMiddleware_` flag is used to ensure that we only ever
  // register the middleware once - despite the ability to de-register and
  // re-register the plugin itself.
  if (isMiddlewareMediatorSupported() && !videojs.usingContribAdsMiddleware_) {
    // Register the play middleware
    videojs.use('*', playMiddleware);
    videojs.usingContribAdsMiddleware_ = true;
  }

  return true;
}

export default register;
export {NAME, hasAdsPlugin};
