import QUnit from 'qunit';
import {ContentPlayback} from '../../../src/states.js';

/*
 * These tests are intended to be isolated unit tests for one state with all
 * other modules mocked.
 */
QUnit.module('ContentPlayback', {
  beforeEach: function() {
    this.events = [];
    this.playTriggered = false;

    this.player = {
      paused: () => false,
      play: () => {
        this.playTriggered = true;
      },
      trigger: (event) => {
        this.events.push(event);
      },
      ads: {
        debug: () => {}
      }
    };

    this.contentPlayback = new ContentPlayback(this.player);
    this.contentPlayback.transitionTo = (newState) => {
      this.newState = newState.name;
    };
  }
});

QUnit.test('only plays on init on correct conditions', function(assert) {
  this.player.paused = () => false;
  this.player.ads._cancelledPlay = false;
  this.player.ads._pausedOnContentupdate = false;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, false);

  this.player.paused = () => true;
  this.player.ads._cancelledPlay = false;
  this.player.ads._pausedOnContentupdate = false;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, false);

  this.player.paused = () => false;
  this.player.ads._cancelledPlay = true;
  this.player.ads._pausedOnContentupdate = false;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, false);

  this.player.paused = () => false;
  this.player.ads._cancelledPlay = false;
  this.player.ads._pausedOnContentupdate = true;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, false);

  this.player.paused = () => true;
  this.player.ads._cancelledPlay = true;
  this.player.ads._pausedOnContentupdate = false;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, true);

  this.player.paused = () => true;
  this.player.ads._cancelledPlay = false;
  this.player.ads._pausedOnContentupdate = true;
  this.contentPlayback.init(this.player);
  assert.equal(this.playTriggered, true);
});

QUnit.test('adsready triggers readyforpreroll', function(assert) {
  this.contentPlayback.init(this.player);
  this.contentPlayback.onAdsReady(this.player);
  assert.equal(this.events[0], 'readyforpreroll');
});

QUnit.test('no readyforpreroll if nopreroll_', function(assert) {
  this.player.ads.nopreroll_ = true;
  this.contentPlayback.init(this.player);
  this.contentPlayback.onAdsReady(this.player);
  assert.equal(this.events.length, 0, 'no events triggered');
});

QUnit.test('transitions to Postroll on contentended', function(assert) {
  this.contentPlayback.init(this.player, false);
  this.contentPlayback.onContentEnded(this.player);
  assert.equal(this.newState, 'Postroll', 'transitioned to Postroll');  
});

QUnit.test('transitions to Midroll on startlinearadmode', function(assert) {
  this.contentPlayback.init(this.player, false);
  this.contentPlayback.startLinearAdMode();
  assert.equal(this.newState, 'Midroll', 'transitioned to Midroll');  
});
