import { playMiddleware, isMiddlewareMediatorSupported } from '../src/playMiddleware.js';

QUnit.module('Play middleware', window.sharedModuleHooks({}));

QUnit.test('is not supported if old video.js version', (assert) => {
  const oldVersion = videojs.VERSION;

  videojs.VERSION = '5.0.0';
  assert.equal(isMiddlewareMediatorSupported(), false,
    'old video.js does not support middleware mediators');

  videojs.VERSION = oldVersion;
});

QUnit.test('is not supported if on mobile', (assert) => {
  const oldUse = videojs.use;
  const oldMiddleware = videojs.middleware;
  const oldTerminator = oldMiddleware ? videojs.middleware.TERMINATOR : null;
  const oldIOS = videojs.IS_IOS;
  const oldAndroid = videojs.IS_ANDROID;

  videojs.browser = {
    IS_ANDROID: true,
    IS_IOS: false
  };
  videojs.use = () => {};
  videojs.middleware = {
    TERMINATOR: 'fake terminator'
  };

  assert.equal(isMiddlewareMediatorSupported(), false,
    'is not supported on Android');

  videojs.browser = {
    IS_ANDROID: false,
    IS_IOS: true
  };

  assert.equal(isMiddlewareMediatorSupported(), false,
    'is not supported on iOS');

  videojs.use = oldUse;
  videojs.middleware.TERMINATOR = oldTerminator;
  videojs.middleware = oldMiddleware;
  videojs.browser.IS_ANDROID = oldAndroid;
  videojs.browser.IS_IOS = oldIOS;
});

QUnit.test('is supported if middleware mediators exist on desktop', (assert) => {
  const oldUse = videojs.use;
  const oldMiddleware = videojs.middleware;
  const oldTerminator = oldMiddleware ? videojs.middleware.TERMINATOR : null;
  const oldIOS = videojs.browser.IS_IOS;
  const oldAndroid = videojs.browser.IS_ANDROID;

  videojs.browser = {
    IS_ANDROID: false,
    IS_IOS: false
  };
  videojs.use = () => {};
  videojs.middleware = {
    TERMINATOR: 'fake terminator'
  };

  assert.equal(isMiddlewareMediatorSupported(), true,
    'is supported if middleware mediators exist and not mobile');

  videojs.use = oldUse;
  videojs.middleware.TERMINATOR = oldTerminator;
  videojs.middleware = oldMiddleware;
  videojs.browser.IS_ANDROID = oldAndroid;
  videojs.browser.IS_IOS = oldIOS;
});

QUnit.test('play middleware returns a setSource method', (assert) => {
  const pm = playMiddleware();
  assert.ok(typeof pm, 'object', 'returns an object');
  assert.ok(pm.setSource, 'has setSource');
});