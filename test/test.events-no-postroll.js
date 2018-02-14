import QUnit from 'qunit';
import videojs from 'video.js';
import '../example/example-integration.js';

QUnit.module('Final Events With No Postroll', {
  beforeEach: function() {
    this.video = document.createElement('video');

    this.fixture = document.createElement('div');
    document.querySelector('body').appendChild(this.fixture);
    this.fixture.appendChild(this.video);

    this.player = videojs(this.video);

    this.player.src({
      src: 'http://vjs.zencdn.net/v/oceans.webm',
      type: 'video/webm'
    });

    this.player.exampleAds({
      'adServerUrl': '/base/test/inventory.json',
      'playPreroll': false,
      'playMidroll': false,
      'playPostroll': false
    });
  },

  afterEach: function() {
    this.player.dispose();
  }
});

QUnit.test('final ended event with no postroll: just 1', function(assert) {
  var done = assert.async();
  var endedEvents = 0;

  // Prevent the test from timing out by making it run faster
  this.player.ads.settings.postrollTimeout = 1;

  this.player.on('ended', () => {
    endedEvents++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.one('ended', () => {
    // Run checks after a pause in case there are multiple ended events.
    setTimeout(() => {
      assert.equal(endedEvents, 1, 'exactly one ended with no postroll');
      done();
    }, 1000);
  });

  // Seek to end once we're ready so postroll can play quickly
  this.player.one('playing', () => {
    this.player.currentTime(46);
  });

  this.player.play();

});
