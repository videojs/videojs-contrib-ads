import pm from '../../src/playMiddleware.js';

const baseMockedVjsNotSupported = {
  use: () => {},
  VERSION: '5.0.0',
  browser: {
  }
};

const baseMockedVjsIsSupported = {
  use: () => {},
  VERSION: '6.7.3',
  browser: {
    IS_IOS: false,
    IS_ANDROID: false
  },
  middleware: {
    TERMINATOR: new Object('fake terminator')
  }
};

// Run custom hooks before sharedModuleHooks, as videojs must be
// modified before seting up the player and videojs-contrib-ads
QUnit.module('Play middleware: not supported unit tests', {
  beforeEach: function() {
    // Stub mobile browsers to force cancelContentPlay to be used
    this.videojs = videojs.mergeOptions({}, baseMockedVjsNotSupported);
  },
  afterEach: function() {
    // Reset variable
    this.videojs = null;
  }
});

QUnit.test('isMiddlewareMediatorSupported is false if old video.js version', function(assert) {
  // Setup mocked videojs features
  this.videojs.browser.IS_ANDROID = false;
  this.videojs.browser.IS_IOS = false;
  pm.testHook(this.videojs);

  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'old video.js does not support middleware mediators');
});

QUnit.test('isMiddlewareMediatorSupported is false if on mobile', function(assert) {
  // Setup mocked videojs features
  this.videojs.browser.IS_ANDROID = true;
  this.videojs.browser.IS_IOS = false;
  pm.testHook(this.videojs);

  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'is not supported on Android');

  // Setup mocked videojs features
  this.videojs.browser.IS_ANDROID = false;
  this.videojs.browser.IS_IOS = true;
  pm.testHook(this.videojs);

  assert.equal(pm.isMiddlewareMediatorSupported(), false,
    'is not supported on iOS');
});

QUnit.module('Play middleware: supported unit tests', {
  beforeEach: function() {
    // Stub mobile browsers to force playMiddleware to be used
    this.videojs = videojs.mergeOptions({}, baseMockedVjsIsSupported);
    // Setup mocked videojs features
    pm.testHook(this.videojs);

    this.triggeredEvent = null;
    this.addedClass = null;

    // Stub the player
    this.player = {
      ads: {
        _shouldBlockPlay: false,
        debug: () => {}
      },
      trigger: (event) => {
        this.triggeredEvent = event;
      },
      addClass: (className) => {
        this.addedClass = className;
      }
    }

    this.sandbox = sinon.sandbox.create();
  },
  afterEach: function() {
    // Reset variables
    this.videojs = null;
    this.sandbox.restore();
  }
});

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
  assert.equal(m.callPlay(), this.videojs.middleware.TERMINATOR,
    'callPlay returns terminator');
});

QUnit.test('playMiddleware callPlay will not terminate if _shouldBlockPlay is false', function(assert) {
  const m = pm.playMiddleware(this.player);

  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);
  this.player.ads._shouldBlockPlay = false;

  assert.equal(m.callPlay(), undefined,
    'callPlay should not return an object');
  assert.notEqual(m.callPlay(), this.videojs.middleware.TERMINATOR,
    'callPlay should not return the terminator');
});

QUnit.test('playMiddleware play will trigger play event if callPlay terminates', function(assert) {
  const m = pm.playMiddleware(this.player);

  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);
  this.player.ads._shouldBlockPlay = true;

  // Play terminates, there's no value returned
  m.play(true, null);
  assert.equal(this.triggeredEvent, 'play');
  assert.equal(this.addedClass, 'vjs-has-started');
});

QUnit.test("playMiddleware won't trigger play event if callPlay doesn't terminate", function(assert) {
  const m = pm.playMiddleware(this.player);

  this.sandbox.stub(pm, 'isMiddlewareMediatorSupported').returns(true);
  m.play(false, {});
  assert.equal(this.triggeredEvent, null, 'no events should be triggered');
  assert.equal(this.addedClass, null, 'no classes should be added');
});
