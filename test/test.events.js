import QUnit from 'qunit';
import videojs from 'video.js';
import '../example/example-integration.js';

QUnit.module('Events', {
  beforeEach: function() {
    // Create video element and player.
    this.video = document.createElement('video');

    document.getElementById('qunit-fixture').appendChild(this.video);

    this.player = videojs(this.video);

    this.player.src({
      src: 'http://vjs.zencdn.net/v/oceans.mp4',
      type: 'video/mp4'
    });
  },

  afterEach: function() {
    // Kill the player and its element (i.e. `this.video`).
    this.player.dispose();
  }
});

QUnit.skip('playing', function(assert) {
  var done = assert.async();
  var playingCount = 0;

  this.player.exampleAds({
    'adServerUrl': '/base/test/inventory.json'
  });

  this.player.on('playing', () => {
    playingCount++;
  });

  window.setInterval(function() {
    videojs.log(this.player.ads.state);
  }.bind(this), 100);

  this.player.play();

  window.setTimeout(function() {
    assert.equal(playingCount, 1);
    done();
  }, 5000);

});
