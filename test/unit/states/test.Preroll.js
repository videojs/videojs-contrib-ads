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
    this.playTriggered = false;

    this.player = {
      ads: {
        debug: () => {},
        settings: {},
        inAdBreak: () => false,
        isContentResuming: () => false,
        _shouldBlockPlay: true
      },
      setTimeout: () => {},
      clearTimeout: () => {},
      addClass: () => {},
      removeClass: () => {},
      one: () => {},
      trigger: (event) => {
        this.events.push(event);
      },
      paused: () => {},
      play: () => {
        this.playTriggered = true;
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
  assert.equal(this.preroll.isWaitingForAdBreak(), true, 'waiting for ad break');

  this.preroll.startLinearAdMode();
  // Because adBreak.start is mocked.
  this.player.ads._inLinearAdMode = true;
  assert.equal(this.adBreakStartStub.callCount, 1, 'ad break started');
  assert.equal(this.player.ads.adType, 'preroll', 'adType is preroll');
  assert.equal(this.preroll.isContentResuming(), false, 'content not resuming');
  assert.equal(this.preroll.inAdBreak(), true, 'in ad break');
  assert.equal(this.preroll.isWaitingForAdBreak(), false, 'not waiting for ad break');

  this.preroll.endLinearAdMode();
  assert.equal(this.adBreakEndStub.callCount, 1, 'ad break ended');
  assert.equal(this.preroll.isContentResuming(), true, 'content resuming');
  assert.equal(this.preroll.isWaitingForAdBreak(), false, 'not waiting for ad break');

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
  assert.equal(this.preroll.isWaitingForAdBreak(), true, 'waiting for ad break');

  this.preroll.startLinearAdMode();
  // Because adBreak.start is mocked.
  this.player.ads._inLinearAdMode = true;
  assert.equal(this.adBreakStartStub.callCount, 1, 'ad break started');
  assert.equal(this.player.ads.adType, 'preroll', 'adType is preroll');
  assert.equal(this.preroll.isContentResuming(), false, 'content not resuming');
  assert.equal(this.preroll.inAdBreak(), true, 'in ad break');
  assert.equal(this.preroll.isWaitingForAdBreak(), false, 'not waiting for ad break');

  this.preroll.endLinearAdMode();
  assert.equal(this.adBreakEndStub.callCount, 1, 'ad break ended');
  assert.equal(this.preroll.isContentResuming(), true, 'content resuming');
  assert.equal(this.preroll.isWaitingForAdBreak(), false, 'not waiting for ad break');

  this.preroll.onPlaying();
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('can handle nopreroll event', function(assert) {
  this.preroll.init(this.player, false, false);
  this.preroll.onNoPreroll(this.player);
  assert.equal(this.preroll.isContentResuming(), true);
  this.preroll.onPlaying(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('can handle adscanceled', function(assert) {
  this.preroll.init(this.player, false, false);
  this.preroll.onAdsCanceled(this.player);
  assert.equal(this.preroll.isContentResuming(), true);
  this.preroll.onPlaying(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('can handle adserror', function(assert) {
  this.preroll.init(this.player, false, false);
  this.preroll.onAdsError(this.player);
  assert.equal(this.preroll.isContentResuming(), true);
  this.preroll.onPlaying(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('can skip linear ad mode', function(assert) {
  this.preroll.init(this.player, false, false);
  this.preroll.skipLinearAdMode();
  assert.equal(this.preroll.isContentResuming(), true);
  this.preroll.onPlaying(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('plays content after ad timeout', function(assert) {
  this.preroll.init(this.player, false, false);
  this.preroll.onAdTimeout(this.player);
  assert.equal(this.preroll.isContentResuming(), true);
  this.preroll.onPlaying(this.player);
  assert.equal(this.newState, 'ContentPlayback', 'transitioned to ContentPlayback');
});

QUnit.test('removes ad loading class on ads started', function(assert) {
  this.preroll.init(this.player, false);

  const removeClassSpy = sinon.spy(this.player, 'removeClass');

  this.preroll.onAdStarted(this.player);
  assert.ok(removeClassSpy.calledWith('vjs-ad-loading'), 'loading class removed');
});

QUnit.test('only plays after no ad in correct conditions', function(assert) {
  this.preroll.init(this.player, false, false);

  this.player.ads._playRequested = false;
  this.player.ads._pausedOnContentupdate = false;
  this.player.paused = () => false;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, false,
    'should not call play when playing already');

  this.player.ads._playRequested = true;
  this.player.ads._pausedOnContentupdate = false;
  this.player.paused = () => false;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, false,
    'should not call play when playing already 2');

  this.player.ads._playRequested = false;
  this.player.ads._pausedOnContentupdate = true;
  this.player.paused = () => false;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, false,
    'should not call play when playing already 3');

  this.player.ads._playRequested = false;
  this.player.ads._pausedOnContentupdate = false;
  this.player.paused = () => true;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, false,
    'should not call play when playback has never started');

  this.player.ads._playRequested = true;
  this.player.ads._pausedOnContentupdate = false;
  this.player.paused = () => true;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, true,
    'should call play when playback had been started and the player is paused');

  this.player.ads._playRequested = false;
  this.player.ads._pausedOnContentupdate = true;
  this.player.paused = () => true;
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.playTriggered, true,
    'should call play when playback had been started on the last source and the player is paused');
});

QUnit.test('remove ad loading class on cleanup', function(assert) {
  this.preroll.init(this.player, false);

  const removeClassSpy = sinon.spy(this.player, 'removeClass');

  this.preroll.cleanup(this.player);
  assert.ok(removeClassSpy.calledWith('vjs-ad-loading'), 'loading class removed');
});

QUnit.test('resets _shouldBlockPlay to false when ad break starts', function(assert) {
  this.preroll.init(this.player, true);
  this.preroll.startLinearAdMode();
  assert.equal(this.player.ads._shouldBlockPlay, false);
});

QUnit.test('resets _shouldBlockPlay to false when no preroll', function(assert) {
  this.preroll.init(this.player, true, false);
  this.preroll.resumeAfterNoPreroll(this.player);
  assert.equal(this.player.ads._shouldBlockPlay, false);
});