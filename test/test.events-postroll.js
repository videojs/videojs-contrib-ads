/*

TODO:
* timeupdate, adtimeupdate, contenttimeupdate
* loadstart, adloadstart, contentloadstart
* play, adplay, contentplay
* contentended
*/

import QUnit from 'qunit';
import videojs from 'video.js';
import '../example/example-integration.js';

QUnit.module('Events', {
  beforeEach: function() {
    this.video = document.createElement('video');

    document.getElementById('qunit-fixture').appendChild(this.video);

    this.player = videojs(this.video);

    this.player.src({
      src: 'http://vjs.zencdn.net/v/oceans.webm',
      type: 'video/webm'
    });

    this.player.exampleAds({
      'adServerUrl': '/base/test/inventory.json',
      'playPreroll': false,
      'playMidroll': false
    });
  }
});

QUnit.test('Postrolls', function(assert) {
  var done = assert.async();

  var beforePostroll = true;
  var seenInAdMode = [];
  var seenInContentResuming = [];
  var seenOutsideAdModeBefore = [];
  var seenOutsideAdModeAfter = [];

  this.player.on('adend', () => {
    beforePostroll = false;
  });

  var events = [
    'suspend',
    'abort',
    'error',
    'emptied',
    'stalled',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'canplaythrough',
    'waiting',
    'seeking',
    'durationchange',
    'progress',
    'pause',
    'ratechange',
    'volumechange',
    'firstplay',
    'suspend',
    'playing',
    'ended'
  ];

  events = events.concat(events.map(function(e) {
    return 'ad' + e;
  }));

  events = events.concat(events.map(function(e) {
    return 'content' + e;
  }));

  this.player.on(events, (e) => {
    if (e.type === 'contentended') {
      return;
    }
    var str = e.type;
    if (this.player.ads.isInAdMode()) {
      if (this.player.ads.isContentResuming()) {
        seenInContentResuming.push(str);
      } else {
        seenInAdMode.push(str);
      }
    } else {
      if (beforePostroll) {
        seenOutsideAdModeBefore.push(str);
      } else {
        seenOutsideAdModeAfter.push(str);
      }
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('ended', () => {

    seenOutsideAdModeBefore.forEach((event) => {
      assert.ok(!/^ad/.test(event), event + ' has no ad prefix before postroll');
      assert.ok(!/^content/.test(event), event + ' has no content prefix before postroll');
    });

    seenInAdMode.forEach((event) => {
      assert.ok(/^ad/.test(event), event + ' has ad prefix during postroll');
    });

    seenInContentResuming.forEach((event) => {
      assert.ok(/^content/.test(event), event + ' has content prefix during postroll');
    });

    seenOutsideAdModeAfter.forEach((event) => {
      assert.ok(!/^ad/.test(event), event + ' has no ad prefix after postroll');
      assert.ok(!/^content/.test(event), event + ' has no content prefix after postroll');
    });

    done();
  });

  // Seek to end once we're ready so postroll can play quickly
  this.player.one('playing', () => {
    this.player.currentTime(46);
  });

  this.player.play();

});
