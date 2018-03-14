import QUnit from 'qunit';
import videojs from 'video.js';
import redispatch from '../../src/redispatch.js';

QUnit.module('Redispatch', {

  beforeEach(assert) {

    // Player event buffer.
    // Mocked player pushes events here when they are triggered.
    // redispatch helper returns event buffer after each redispatch.
    let eventBuffer = [];

    // Mocked player
    this.player = {
      trigger(event) {
        eventBuffer.push(event);
      },

      currentSrc() {
        return 'my vid';
      },

      ads: {
        snapshot: {
          ended: false,
          currentSrc: 'my vid'
        },

        videoElementRecycled() {
          return false;
        },

        stitchedAds() {
          return false;
        },

        _state: {
          _hasThereBeenAdPlaying: false,
          constructor: function(player) {},
          transitionTo: function(NewState, ...args) {},
          init: function() {},
          cleanup: function() {},
          isAdState: function() {},
          isContentResuming: function() {},
          inAdBreak: function() {}
        }
      }
    };

    // Redispatch helper for tests
    this.redispatch = function(type) {
      const event = {type};

      eventBuffer = [];
      redispatch.call(this.player, event);

      if (eventBuffer.length === 1) {
        return eventBuffer[0].type;
      } else if (event.cancelBubble) {
        return 'cancelled';
      } else if (eventBuffer.length === 0) {
        return 'ignored';
      } else {
        throw new Error('Event buffer has more than 1 event');
      }

    }
  }

});

QUnit.test('playing event in different ad states', function(assert) {

  this.player.ads.isInAdMode = () => false;
  this.player.ads.isContentResuming = () => false;
  assert.equal(this.redispatch('playing'), 'ignored');

  this.player.ads.isInAdMode = () => true;
  this.player.ads.isContentResuming = () => false;
  assert.equal(this.redispatch('playing'), 'adplaying');

  this.player.ads.isInAdMode = () => true;
  this.player.ads.isContentResuming = () => true;
  assert.equal(this.redispatch('playing'), 'ignored');

});

QUnit.test('no repeated adplaying event in a single ad break', function(assert) {
  this.player.ads.isInAdMode = () => true;
  this.player.ads.isContentResuming = () => false;
  this.player.ads._state._hasThereBeenAdPlaying = true;
  assert.equal(this.redispatch('playing'), 'cancelled');
});

QUnit.test('no repeated play events due to resuming after nopreroll', function(assert) {
  this.player.ads.inAdBreak = () => false;
  this.player.ads.isInAdMode = () => false;
  this.player.ads.isContentResuming = () => false;
  this.player.ads._state.isResumingAfterNoAd = () => true;
  this.player.ads._playRequested = true;
  assert.equal(this.redispatch('play'), 'contentplay');
});