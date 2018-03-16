import QUnit from 'qunit';
import {BeforePreroll} from '../../../src/states.js';
import * as CancelContentPlay from '../../../src/cancelContentPlay.js';

/*
 * These tests are intended to be isolated unit tests for one state with all
 * other modules mocked.
 */
QUnit.module('BeforePreroll', {
  beforeEach: function() {
    this.events = [];

    this.player = {
      ads: {
        debug: () => {}
      },
      setTimeout: () => {},
      trigger: (event) => {
        this.events.push(event);
      }
    };

    this.beforePreroll = new BeforePreroll(this.player);
    this.beforePreroll.transitionTo = (newState, arg) => {
      this.newState = newState.name;
      this.transitionArg = arg;
    };

    this.cancelContentPlayStub = sinon.stub(CancelContentPlay, 'cancelContentPlay');
  },

  afterEach: function() {
    this.cancelContentPlayStub.restore();
  }
});

QUnit.test('transitions to Preroll (adsready first)', function(assert) {
  this.beforePreroll.init();
  assert.equal(this.beforePreroll.adsReady, false);
  this.beforePreroll.onAdsReady(this.player);
  assert.equal(this.beforePreroll.adsReady, true);
  this.beforePreroll.onPlay(this.player);
  assert.equal(this.newState, 'Preroll');
  assert.equal(this.transitionArg, true);
});

QUnit.test('transitions to Preroll (play first)', function(assert) {
  this.beforePreroll.init();
  assert.equal(this.beforePreroll.adsReady, false);
  this.beforePreroll.onPlay(this.player);
  assert.equal(this.newState, 'Preroll');
  assert.equal(this.transitionArg, false);
});

QUnit.test('cancels ads', function(assert) {
  this.beforePreroll.init();
  this.beforePreroll.onAdsCanceled(this.player);
  assert.equal(this.newState, 'ContentPlayback');
});

QUnit.test('transitions to content playback on error', function(assert) {
  this.beforePreroll.init();
  this.beforePreroll.onAdsError(this.player);
  assert.equal(this.newState, 'ContentPlayback');
});

QUnit.test('has no preroll', function(assert) {
  this.beforePreroll.init();
  this.beforePreroll.onNoPreroll(this.player);
  assert.equal(this.newState, 'ContentPlayback');
});

QUnit.test('skips the preroll', function(assert) {
  this.beforePreroll.init();
  this.beforePreroll.skipLinearAdMode();
  assert.equal(this.events[0], 'adskip');
  assert.equal(this.newState, 'ContentPlayback');
});

QUnit.test('does nothing on content change', function(assert) {
  this.beforePreroll.init();
  this.beforePreroll.onContentChanged(this.player);
  assert.equal(this.newState, undefined);
});
