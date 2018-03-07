import { playMiddleware, isMiddlewareMediatorSupported } from '../src/playMiddleware.js';

QUnit.module('Play middleware: not supported', window.sharedModuleHooks({
  // let oldVersion;
  // let oldUse;
  // let oldMiddleware;
  // let oldIOS;
  // let oldAndroid;

  beforeEach: function() {
    this.sandbox.oldMiddleware = videojs.middleware ? videojs.mergeOptions({}, videojs.middleware) : undefined;

    this.sandbox.stub(videojs, 'VERSION').get(() => {
      return '6.0.0';
    });
    this.sandbox.stub(videojs, 'use').get(() => {
      return undefined;
    });
    // this.sandbox.stub(videojs, 'middleware').get(() => {
    //   return { TERMINATOR: 'fake terminator' };
    // });
    this.sandbox.stub(videojs, 'browser').get(() => {
      return {
        IS_ANDROID: false,
        IS_IOS: false
      };
    });

    // const mockVideojs = {
    //   VERSION: '6.0.0',
    //   browser: {
    //     IS_ANDROID: false,
    //     IS_IOS: false
    //   }
    // };
    // this.oldVjs = window.videojs;
    // window.videojs = mockVideojs;
  }
}));

QUnit.test('is not supported if old video.js version', function(assert) {
  this.sandbox.stub(videojs, 'VERSION').get(() => {
    return '5.0.0';
  });
  // TODO stub out middleware somehow
  sinon.stub(videojs.middleware, undefined);
  assert.equal(isMiddlewareMediatorSupported(), false,
    'old video.js does not support middleware mediators');
});

QUnit.test('is not supported if on mobile', (assert) => {
  assert.test.testEnvironment.sandbox.stub(videojs, 'browser').get(() => {
    return {
      IS_ANDROID: true,
      IS_IOS: false
    };
  });
  assert.equal(isMiddlewareMediatorSupported(), false,
    'is not supported on Android');

  assert.test.testEnvironment.sandbox.stub(videojs, 'browser').get(() => {
    return {
      IS_ANDROID: false,
      IS_IOS: true
    };
  });
  assert.equal(isMiddlewareMediatorSupported(), false,
    'is not supported on iOS');
});

QUnit.module('Play middleware: supported', window.sharedModuleHooks({
  beforeEach: function() {
    this.sandbox.stub(videojs, 'browser').get(() => {
      return {
        IS_ANDROID: false,
        IS_IOS: false
      };
    });
  }
}));

QUnit.test('is supported if middleware mediators exist on desktop', function(assert) {
  assert.equal(isMiddlewareMediatorSupported(), true,
    'is supported if middleware mediators exist and not mobile');
});

QUnit.test('play middleware has a setSource, callPlay and play method', function(assert) {
  const pm = playMiddleware(this.player);
  assert.equal(typeof pm, 'object', 'returns an object');
  assert.equal(typeof pm.setSource, 'function', 'has setSource');
  assert.equal(typeof pm.callPlay, 'function', 'has callPlay');
  assert.equal(typeof pm.play, 'function', 'has play');
});

  // QUnit.module('behavior tests', (hooks) => {
  //   hooks.before((assert) => {
  //     if (!isMiddlewareMediatorSupported()) {
  //       console.log('Middleware are not supported with this version of video.js', videojs.VERSION);
  //       assert.expect(0);
  //     }
  //   });

  // });