import { playMiddleware, isMiddlewareMediatorSupported } from '../src/playMiddleware.js';

QUnit.module('Play middleware: not supported unit tests', window.sharedModuleHooks({
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

QUnit.test('isMiddlewareMediatorSupported is false if old video.js version', function(assert) {
  this.sandbox.stub(videojs, 'VERSION').get(() => {
    return '5.0.0';
  });
  // TODO stub out middleware somehow
  sinon.stub(videojs.middleware, undefined);
  assert.equal(isMiddlewareMediatorSupported(), false,
    'old video.js does not support middleware mediators');
});

QUnit.test('isMiddlewareMediatorSupported is false if on mobile', (assert) => {
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

QUnit.module('Play middleware: supported unit tests', window.sharedModuleHooks({
  beforeEach: function() {
    this.sandbox.stub(videojs, 'browser').get(() => {
      return {
        IS_ANDROID: false,
        IS_IOS: false
      };
    });
  }
}));

QUnit.test('isMiddlewareMediatorSupported is true if middleware mediators exist on desktop', function(assert) {
  assert.equal(isMiddlewareMediatorSupported(), true,
    'is supported if middleware mediators exist and not mobile');
});

QUnit.test('playMiddleware returns with a setSource, callPlay and play method', function(assert) {
  const pm = playMiddleware(this.player);
  assert.equal(typeof pm, 'object', 'returns an object');
  assert.equal(typeof pm.setSource, 'function', 'has setSource');
  assert.equal(typeof pm.callPlay, 'function', 'has callPlay');
  assert.equal(typeof pm.play, 'function', 'has play');
});

QUnit.test('playMiddleware callPlay will terminate if _shouldBlockPlay is true', function(assert) {
  const pm = playMiddleware(this.player);

  this.player.ads._shouldBlockPlay = true
  assert.equal(pm.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay returns terminator');
});

QUnit.test('playMiddleware callPlay will not terminate if _shouldBlockPlay is false', function(assert) {
  const pm = playMiddleware(this.player);

  this.player.ads._shouldBlockPlay = false;

  assert.equal(pm.callPlay(), undefined,
    'callPlay should not return an object');
  assert.notEqual(pm.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay should not return the terminator');
});

QUnit.test('playMiddleware play will trigger play event if callPlay terminates', function(assert) {
  const pm = playMiddleware(this.player);
  const playSpy = this.sandbox.spy();

  this.player.ads._shouldBlockPlay = false;
  this.player.one('play', playSpy);

  pm.play(true, null);
  assert.equal(playSpy.callCount, 1);
});