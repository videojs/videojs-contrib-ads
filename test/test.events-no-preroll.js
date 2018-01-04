import QUnit from 'qunit';
import videojs from 'video.js';
import '../example/example-integration.js';

QUnit.module('Initial Events With No Preroll', {
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
      'playMidroll': false
    });

  },

  afterEach: function() {
    this.player.dispose();
  }
});

QUnit.test('initial play event with no preroll: one please', function(assert) {
  var done = assert.async();

  var playEvents = 0;

  this.player.on('play', () => {
    playEvents++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(playEvents, 1, '1 play event');
      done();
    }
  });

  this.player.play();

});

QUnit.test('initial playing event with no preroll: 1+', function(assert) {
  var done = assert.async();

  var playingEvents = 0;

  this.player.on('playing', () => {
    playingEvents++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.ok(playingEvents >= 1, '1+ playing events');
      done();
    }
  });

  this.player.play();

});


QUnit.test('no ended event at start if video with no preroll', function(assert) {
  var done = assert.async();

  var endedEvents = 0;

  this.player.on('ended', () => {
    endedEvents++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(endedEvents, 0, 'no ended events');
      done();
    }
  });

  this.player.play();

});

QUnit.test('initial loadstart event with no preroll: one please', function(assert) {
  var done = assert.async();

  var loadstartEvents = 0;

  this.player.on('loadstart', () => {
    loadstartEvents++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(loadstartEvents, 1, '1 loadstart event');
      done();
    }
  });

  this.player.play();

});
