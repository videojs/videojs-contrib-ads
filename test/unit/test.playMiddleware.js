import pm from '../../src/playMiddleware.js';

const sharedHooks = window.sharedModuleHooks();

// Stub mobile browsers to force cancelContentPlay to be used
const fakeVideojs = function() {

};

// Restore original videojs behavior
const restoreVideojs = function() {

};


// Run custom hooks before sharedModuleHooks, as videojs must be
// modified before seting up the player and videojs-contrib-ads
QUnit.module.skip('Play middleware: not supported unit tests', {
  beforeEach: fakeVideojs,
  afterEach: restoreVideojs
});

// TODO stub out middleware somehow
QUnit.test('isMiddlewareMediatorSupported is false if old video.js version', function(assert) {
  this.videojs = {
      use: () => {},
      VERSION: '5.0.0',
      browser: {
        IS_ANDROID: false,
        IS_IOS: false
      }
  };
  pm.testHook(this.videojs);
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
  assert.notEqual(typeof m.callPlay(), 'object',
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

QUnit.skip('isMiddlewareMediatorSupported is true if middleware mediators exist on desktop', function(assert) {
  assert.equal(pm.isMiddlewareMediatorSupported(), true,
    'is supported if middleware mediators exist and not mobile');
});

QUnit.skip('playMiddleware returns with a setSource, callPlay and play method', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  assert.equal(typeof m, 'object', 'returns an object');
  assert.equal(typeof m.setSource, 'function', 'has setSource');
  assert.equal(typeof m.callPlay, 'function', 'has callPlay');
  assert.equal(typeof m.play, 'function', 'has play');
});

QUnit.skip('playMiddleware callPlay will terminate if _shouldBlockPlay is true', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.ads._shouldBlockPlay = true
  assert.equal(m.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay returns terminator');
});

QUnit.skip('playMiddleware callPlay will not terminate if _shouldBlockPlay is false', function(assert) {
  const m = pm.playMiddleware(this.player);
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.ads._shouldBlockPlay = false;

  assert.equal(m.callPlay(), undefined,
    'callPlay should not return an object');
  assert.notEqual(m.callPlay(), videojs.middleware.TERMINATOR,
    'callPlay should not return the terminator');
});

QUnit.skip('playMiddleware play will trigger play event if callPlay terminates', function(assert) {
  const m = pm.playMiddleware(this.player);
  const playSpy = this.sandbox.spy();
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);


  this.player.ads._shouldBlockPlay = true;
  this.player.one('play', playSpy);

  m.play(true, null);
  assert.equal(playSpy.callCount, 1);
});

QUnit.skip("playMiddleware won't trigger play event if callPlay doesn't terminate", function(assert) {
  const m = pm.playMiddleware(this.player);
  const playSpy = this.sandbox.spy();
  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);

  this.player.one('play', playSpy);

  m.play(false, {});
  assert.equal(playSpy.callCount, 0);
});