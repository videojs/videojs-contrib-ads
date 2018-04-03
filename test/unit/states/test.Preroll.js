import QUnit from 'qunit';
import {Preroll} from '../../../src/states.js';
import * as CancelContentPlay from '../../../src/cancelContentPlay.js';
import adBreak from '../../../src/adBreak.js';

/*
 * These tests are intended to be isolated unit tests for one state with all
 * other modules mocked.
 */
QUnit.module('Preroll', {
  beforeEach: function() {
    this.events = [];

    this.player = {
      ads: {
        debug: () => {},
        settings: {},
        inAdBreak: () => false,
        isContentResuming: () => false
      },
      setTimeout: () => {},
      clearTimeout: () => {},
      addClass: () => {},
      removeClass: () => {},
      one: () => {},
      trigger: (event) => {
        this.events.push(event);
      }
    };

    this.preroll = new Preroll(this.player);

    this.preroll.transitionTo = (newState, arg) => {
      this.newState = newState.name;
      this.transitionArg = arg;
    };

    this.preroll.afterLoadStart = (callback) => {
      callback();
    };

    this.adBreakStartStub = sinon.stub(adBreak, 'start');
    this.adBreakEndStub = sinon.stub(adBreak, 'end');
  },

  afterEach() {
    this.adBreakStartStub.restore();
    this.adBreakEndStub.restore();
  }
});

QUnit.test('plays a preroll (adsready true)', function(assert) {
  this.preroll.init(this.player, true);
  assert.equal(this.preroll.adsReady, true, 'adsready from init');
  assert.equal(this.events[0], 'readyforpreroll', 'readyforpreroll from init');
  assert.equal(this.preroll.inAdBreak(), false, 'not in ad break');

  this.preroll.startLinearAdMode();
  // Because adBreak.start is mocked.
  this.player.ads._inLinearAdMode = true;
  assert.equal(this.adBreakStartStub.callCount, 1, 'ad break started');
  assert.equal(this.player.ads.adType, 'preroll', 'adType is preroll');
  assert.equal(this.preroll.isContentResuming(), false, 'content not resuming');
  assert.equal(this.preroll.inAdBreak(), true, 'in ad break');

  this.preroll.endLinearAdMode();
  assert.equal(this.adBreakEndStub.callCount, 1, 'ad break ended');
  assert.equal(this.preroll.isContentResuming(), true, 'content resuming');

  this.preroll.onPlaying();
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('plays a preroll (adsready false)', function(assert) {
  this.preroll.init(this.player, false);
  assert.equal(this.preroll.adsReady, false, 'not adsReady yet');

  this.preroll.onAdsReady(this.player);
  assert.equal(this.preroll.adsReady, true, 'adsready from init');
  assert.equal(this.events[0], 'readyforpreroll', 'readyforpreroll from init');
  assert.equal(this.preroll.inAdBreak(), false, 'not in ad break');

  this.preroll.startLinearAdMode();
  // Because adBreak.start is mocked.
  this.player.ads._inLinearAdMode = true;
  assert.equal(this.adBreakStartStub.callCount, 1, 'ad break started');
  assert.equal(this.player.ads.adType, 'preroll', 'adType is preroll');
  assert.equal(this.preroll.isContentResuming(), false, 'content not resuming');
  assert.equal(this.preroll.inAdBreak(), true, 'in ad break');

  this.preroll.endLinearAdMode();
  assert.equal(this.adBreakEndStub.callCount, 1, 'ad break ended');
  assert.equal(this.preroll.isContentResuming(), true, 'content resuming');

  this.preroll.onPlaying();
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('can handle nopreroll event', function(assert) {
  this.preroll.init(this.player, false);
  this.preroll.onNoPreroll(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');  
});

QUnit.test('can handle adscanceled', function(assert) {
  this.preroll.init(this.player, false);
  this.preroll.onAdsCanceled(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');  
});

QUnit.test('can handle adserror', function(assert) {
  this.preroll.init(this.player, false);
  this.preroll.onAdsError(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');  
});

QUnit.test('can skip linear ad mode', function(assert) {
  this.preroll.init(this.player, false);
  this.preroll.skipLinearAdMode();
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');  
});

QUnit.test('plays content after ad timeout', function(assert) {
  this.preroll.init(this.player, false);
  this.preroll.onAdTimeout(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');  
});

QUnit.test('removes ad loading class on ads started', function(assert) {
  this.preroll.init(this.player, false);

  const removeClassSpy = sinon.spy(this.player, 'removeClass');

  this.preroll.onAdStarted(this.player);
  assert.ok(removeClassSpy.calledWith('vjs-ad-loading'), 'loading class removed');
});

QUnit.test('remove ad loading class on cleanup', function(assert) {
  this.preroll.init(this.player, false);

  const removeClassSpy = sinon.spy(this.player, 'removeClass');

  this.preroll.cleanup();
  assert.ok(removeClassSpy.calledWith('vjs-ad-loading'), 'loading class removed');
});
