/*
TODO:
* timeupdate, adtimeupdate, contenttimeupdate
* loadstart, adloadstart, contentloadstart
* play, adplay, contentplay
* loadeddata, adloadeddata, contentloadeddata
* loadedmetadata, adloadedmetadata, contentloadedmetadata
*/

import videojs from 'video.js';
import '../../examples/stitched-ad-plugin/plugin.js';

let originalTestTimeout = QUnit.config.testTimeout;

QUnit.module('Events and Stitched Ads', {

  before() {
    QUnit.config.testTimeout = 30000;
  },

  beforeEach() {
    this.video = document.createElement('video');

    this.fixture = document.querySelector('#qunit-fixture');
    this.fixture.appendChild(this.video);

    this.player = videojs(this.video);
    this.player.exampleStitchedAds();

    this.player.src({
      src: 'http://vjs.zencdn.net/v/oceans.webm',
      type: 'video/webm'
    });
  },

  afterEach() {
    this.player.dispose();
  },

  after() {
    QUnit.config.testTimeout = originalTestTimeout;
  }
});

QUnit.test('Stitched Ads', function(assert) {
  const done = assert.async();

  const seenBeforePreroll = [];
  const seenDuringPreroll = [];
  const seenAfterPreroll = [];
  const seenDuringMidroll = [];
  const seenAfterMidroll = [];
  let currentEventLog = seenBeforePreroll;

  let events = [
    'suspend',
    'abort',
    'error',
    'emptied',
    'stalled',
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

  events = events
    .concat(events.map(e => 'ad' + e))
    .concat(events.map(e => 'content' + e));

  const {player} = this;

  player.on('adstart', () => {
    if (currentEventLog === seenBeforePreroll) {
      currentEventLog = seenDuringPreroll;
    } else {
      currentEventLog = seenDuringMidroll;
    }
  });

  player.on('adend', () => {
    if (currentEventLog === seenDuringPreroll) {
      currentEventLog = seenAfterPreroll;
    } else {
      currentEventLog = seenAfterMidroll;
    }
  });

  player.on(events, (e) => currentEventLog.push(e.type));

  player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  player.on('timeupdate', () => {
    videojs.log(player.currentTime(), player.currentSrc());

    if (player.currentTime() > 21) {
      seenBeforePreroll.forEach(event => {
        assert.ok(!/^ad/.test(event), event + ' has no ad prefix before preroll');
        assert.ok(!/^content/.test(event), event + ' has no content prefix before preroll');
      });

      seenDuringPreroll.forEach(event => {
        assert.ok(/^ad/.test(event), event + ' has ad prefix during preroll');
      });

      seenAfterPreroll.forEach(event => {
        assert.ok(!/^ad/.test(event), event + ' has no ad prefix after preroll');
        assert.ok(!/^content/.test(event), event + ' has no content prefix after preroll');
      });

      seenDuringMidroll.forEach(event => {
        assert.ok(/^ad/.test(event), event + ' has ad prefix during midroll');
      });

      seenAfterMidroll.forEach(event => {
        assert.ok(!/^ad/.test(event), event + ' has no ad prefix after midroll');
        assert.ok(!/^content/.test(event), event + ' has no content prefix after midroll');
      });

      done();
    }
  });

  player.ready(player.play);
});
