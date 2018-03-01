import { playMiddleware, isMiddlewareMediatorSupported } from '../src/playMiddleware.js';

QUnit.module('Play middleware', window.sharedModuleHooks({}), (hooks) => {

  QUnit.module('unit tests', (hooks) => {
    let oldVersion;
    let oldUse;
    let oldMiddleware;
    let oldIOS;
    let oldAndroid;

    hooks.beforeEach((assert) => {
      oldVersion = videojs.VERSION;
      oldUse = videojs.use;
      oldMiddleware = videojs.middleware ? videojs.mergeOptions({}, videojs.middleware) : undefined;
      oldIOS = videojs.browser.IS_IOS;
      oldAndroid = videojs.browser.IS_ANDROID;

      videojs.VERSION = '6.0.0';
      videojs.use = () => {};
      videojs.middleware = {
        TERMINATOR: 'fake terminator'
      };
      videojs.browser = {
        IS_ANDROID: false,
        IS_IOS: false
      };
    });
    hooks.afterEach(() => {
      videojs.VERSION = oldVersion;
      videojs.use = oldUse;
      videojs.middleware = oldMiddleware;
      videojs.browser = {
        IS_ANDROID: oldAndroid,
        IS_IOS: oldIOS
      };
    });

    QUnit.test('is not supported if old video.js version', (assert) => {
      videojs.VERSION = '5.0.0';
      videojs.use = videojs.middleware = undefined;
      assert.equal(isMiddlewareMediatorSupported(), false,
        'old video.js does not support middleware mediators');
    });

    QUnit.test('is not supported if on mobile', (assert) => {
      videojs.browser.IS_ANDROID = true;
      videojs.browser.IS_IOS = false;
      assert.equal(isMiddlewareMediatorSupported(), false,
        'is not supported on Android');

      videojs.browser.IS_ANDROID = false;
      videojs.browser.IS_IOS = true;
      assert.equal(isMiddlewareMediatorSupported(), false,
        'is not supported on iOS');
    });

    QUnit.test('is supported if middleware mediators exist on desktop', (assert) => {
      assert.equal(isMiddlewareMediatorSupported(), true,
        'is supported if middleware mediators exist and not mobile');
    });

    QUnit.test('play middleware has a setSource, callPlay and play method', (assert) => {
      const pm = playMiddleware();
      assert.equal(typeof pm, 'object', 'returns an object');
      assert.equal(typeof pm.setSource, 'function', 'has setSource');
      assert.equal(typeof pm.callPlay, 'function', 'has callPlay');
      assert.equal(typeof pm.play, 'function', 'has play');
    });
  });

  QUnit.module('behavior tests', (hooks) => {
    hooks.before((assert) => {
      if (!isMiddlewareMediatorSupported()) {
        console.log('Middleware are not supported with this version of video.js', videojs.VERSION);
        assert.expect(0);
      }
    });

  });

});



