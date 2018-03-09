import pm from '../src/playMiddleware.js';

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
  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'old video.js does not support middleware mediators');
});

QUnit.test('isMiddlewareMediatorSupported is false if on mobile', function(assert) {
  assert.test.testEnvironment.sandbox.stub(videojs, 'browser').get(() => {
    return {
      IS_ANDROID: true,
      IS_IOS: false
    };
  });
  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'is not supported on Android');

  assert.test.testEnvironment.sandbox.stub(videojs, 'browser').get(() => {
    return {
      IS_ANDROID: false,
      IS_IOS: true
    };
  });
  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'is not supported on iOS');
});

QUnit.test('playMiddleware callPlay will not terminate if not supported', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(false);
  this.player.ads._shouldBlockPlay = true;
  assert.equal(m.callPlay(), undefined,
    'callPlay should not return an object');
  assert.notEqual(m.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay should not return the terminator');
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
  assert.equal(pm.isMiddlewareMediatorSupported(), true,
    'is supported if middleware mediators exist and not mobile');
});

QUnit.test('playMiddleware returns with a setSource, callPlay and play method', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  assert.equal(typeof m, 'object', 'returns an object');
  assert.equal(typeof m.setSource, 'function', 'has setSource');
  assert.equal(typeof m.callPlay, 'function', 'has callPlay');
  assert.equal(typeof m.play, 'function', 'has play');
});

QUnit.test('playMiddleware callPlay will terminate if _shouldBlockPlay is true', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.ads._shouldBlockPlay = true
  assert.equal(m.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay returns terminator');
});

QUnit.test('playMiddleware callPlay will not terminate if _shouldBlockPlay is false', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.ads._shouldBlockPlay = false;

  assert.equal(m.callPlay(), undefined,
    'callPlay should not return an object');
  assert.notEqual(m.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay should not return the terminator');
});

QUnit.test('playMiddleware play will trigger play event if callPlay terminates', function(assert) {
  const m = pm.playMiddleware(this.player);
  const playSpy = this.sandbox.spy();
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);


  this.player.ads._shouldBlockPlay = true;
  this.player.one('play', playSpy);

  m.play(true, null);
  assert.equal(playSpy.callCount, 1);
});

QUnit.test("playMiddleware won't trigger play event if callPlay doesn't terminate", function(assert) {
  const m = pm.playMiddleware(this.player);
  const playSpy = this.sandbox.spy();
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.one('play', playSpy);

  m.play(false, {});
  assert.equal(playSpy.callCount, 0);
});