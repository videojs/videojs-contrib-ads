import QUnit from 'qunit';
import videojs from 'video.js';
import '../../examples/basic-ad-plugin/example-integration.js';

QUnit.module('Integration: play middleware', {
  beforeEach: function() {
    this.video = document.createElement('video');

    // this.fixture = document.createElement('div');
    this.fixture = document.querySelector('#qunit-fixture');
    // document.querySelector('body').appendChild(this.fixture);
    this.fixture.appendChild(this.video);

    this.sandbox = sinon.sandbox.create();
    this.clock = sinon.useFakeTimers();

    this.player = videojs(this.video);

    this.player.exampleAds({
      'adServerUrl': '/base/test/integration/lib/inventory.json'
    });
  },

  afterEach: function() {
    this.clock.restore();
    this.sandbox.restore();
    this.player.dispose();
  }
});

QUnit.test('the `_playRequested` flag is set on the first play request', function(assert) {
  this.player.src({
    src: 'http://vjs.zencdn.net/v/oceans.webm',
    type: 'video/webm'
  });

  this.player.ready(this.player.play);

  this.clock.tick(1); // Allow play handlers to run
  assert.strictEqual(this.player.ads._playRequested, true,
  '_playRequested is true when the play method is used too');
});

QUnit.test('blocks calls to play to wait for prerolls when the plugin loads BEFORE play', function(assert) {
  const techPlaySpy = this.sandbox.spy(this.video, 'play');
  const playEventSpy = this.sandbox.spy();

  this.player.on('play', playEventSpy);

  this.player.src({
    src: 'http://vjs.zencdn.net/v/oceans.webm',
    type: 'video/webm'
  });


  this.player.ready(() => {
    this.player.play();
  });

  this.clock.tick(1); // Allow play handlers to run

  assert.strictEqual(techPlaySpy.callCount, 0,
    "tech play shouldn't be called while waiting for prerolls");
  assert.strictEqual(playEventSpy.callCount, 1,
    'play event should be triggered');
});

// QUnit.test('blocks calls to play to wait for prerolls when the plugin loads AFTER play', function(assert) {

// });