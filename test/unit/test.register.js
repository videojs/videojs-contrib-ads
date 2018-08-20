import videojs from 'video.js';
import contribAdsPlugin from '../../src/plugin.js';
import register from '../../src/register.js';
import {NAME, hasAdsPlugin} from '../../src/register.js';

// Cross-compatible plugin de-registration.
const deregister = () => {
  if (videojs.deregisterPlugin) {
    return videojs.deregisterPlugin(NAME);
  }

  if (videojs.getPlugin) {
    const Plugin = videojs.getPlugin('plugin');

    if (Plugin && Plugin.deregisterPlugin) {
      return Plugin.deregisterPlugin(NAME);
    }
  }

  const Player = videojs.getComponent('Player');

  if (Player && Player.prototype[NAME]) {
    delete Player.prototype[NAME];
  }
};

QUnit.module('Register');

QUnit.test('registration fails if plugin exists, succeeds otherwise', function(assert) {

  // The plugin is already registered here.
  assert.notOk(register(contribAdsPlugin), 'plugin was already registered');
  assert.ok(hasAdsPlugin(), 'plugin exists');

  // De-register the plugin and verify that it no longer exists.
  deregister();
  assert.notOk(hasAdsPlugin(), 'plugin does not exist');

  // Re-register the plugin and verify that it exists.
  assert.ok(register(contribAdsPlugin), 'plugin was registered');
  assert.ok(hasAdsPlugin(), 'plugin exists');
});
