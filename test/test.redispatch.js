import QUnit from 'qunit';
import videojs from 'video.js';
import redispatch from '../src/redispatch.js';

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
        state: 'content-set',

        snapshot: {
          ended: false,
          currentSrc: 'my vid'
        },

        videoElementRecycled() {
          return false;
        },

        stitchedAds() {
          return false;
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

// More information in this comment: https://github.com/videojs/videojs-contrib-ads/blob/320243d316cd6dc7f45146eab68c2b759d841578/src/redispatch.js#L73-L76
QUnit.test('playing is cancelled during ad playback if video element is recycled', function(assert) {
  this.player.ads.isInAdMode = () => true;
  this.player.ads.isContentResuming = () => false;
  this.player.ads.videoElementRecycled = () => true;
  assert.equal(this.redispatch('playing'), 'cancelled');
});
