/*
TODO:
* adplay, contentplay
* adplaying, contentplaying
* adloadstart, contentloadstart
* adended, contentended
* adloadeddata, contentloadeddata
* adloadedmetadata, contentloadedmetadata
*/

import QUnit from 'qunit';
import videojs from 'video.js';
import '../../examples/basic-ad-plugin/example-integration.js';

QUnit.module('Events and Prerolls', {
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
      'adServerUrl': '/base/test/integration/lib/inventory.json'
    });

  },

  afterEach: function() {
    this.player.dispose();
  }
});

QUnit.test('playing event and prerolls: 0 before preroll, 1+ after', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var playingBeforePreroll = 0;
  var playingAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('playing', () => {
    if (beforePreroll) {
      playingBeforePreroll++;
    } else {
      playingAfterPreroll++;
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(playingBeforePreroll, 0, 'no playing before preroll');
      assert.ok(playingAfterPreroll > 0, 'playing after preroll');
      done();
    }
  });

  this.player.play();

});

QUnit.test('ended event and prerolls: not even once', function(assert) {
  var done = assert.async();

  var ended = 0;

  this.player.on('ended', () => {
    ended++;
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(ended, 0, 'no ended events');
      done();
    }
  });

  this.player.play();

});

QUnit.test('loadstart event and prerolls: 1 before preroll, 0 after', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var loadstartBeforePreroll = 0;
  var loadstartAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('loadstart', (e) => {
    if (beforePreroll) {
      loadstartBeforePreroll++;
    } else {
      loadstartAfterPreroll++;
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', (e) => {
    if (this.player.currentTime() > 1) {
      assert.equal(loadstartBeforePreroll, 1, 'loadstart before preroll');
      assert.equal(loadstartAfterPreroll, 0, 'loadstart after preroll');
      done();
    }
  });

  this.player.play();

});

QUnit.test('loadedmetadata event and prerolls: 1 before preroll, 0 after', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var loadedmetadataBeforePreroll = 0;
  var loadedmetadataAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('loadedmetadata', (e) => {
    if (beforePreroll) {
      loadedmetadataBeforePreroll++;
    } else {
      loadedmetadataAfterPreroll++;
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', (e) => {
    if (this.player.currentTime() > 1) {
      assert.equal(loadedmetadataBeforePreroll, 1, 'loadedmetadata before preroll');
      assert.equal(loadedmetadataAfterPreroll, 0, 'loadedmetadata after preroll');
      done();
    }
  });

  this.player.play();

});

QUnit.test('loadeddata event and prerolls: 1 before preroll, 0 after', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var loadeddataBeforePreroll = 0;
  var loadeddataAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('loadeddata', (e) => {
    if (beforePreroll) {
      loadeddataBeforePreroll++;
    } else {
      loadeddataAfterPreroll++;
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', (e) => {
    if (this.player.currentTime() > 1) {
      assert.equal(loadeddataBeforePreroll, 1, 'loadeddata before preroll');
      assert.equal(loadeddataAfterPreroll, 0, 'loadeddata after preroll');
      done();
    }
  });

  this.player.play();

});

QUnit.test('play event and prerolls: 1 before preroll, 0 after', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var playBeforePreroll = 0;
  var playAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('play', () => {
    if (beforePreroll) {
      playBeforePreroll++;
    } else {
      playAfterPreroll++;
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(playBeforePreroll, 1, 'play before preroll'); // 2
      assert.equal(playAfterPreroll, 0, 'play after preroll');
      done();
    }
  });

  this.player.play();

});

QUnit.test('Event prefixing and prerolls', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var seenInAdMode = [];
  var seenInContentResuming = [];
  var seenOutsideAdModeBefore = [];
  var seenOutsideAdModeAfter = [];

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  var events = [
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
    'timeupdate',
    'progress',
    'pause',
    'ratechange',
    'volumechange',
    'firstplay',
    'suspend'
  ];

  events = events.concat(events.map(function(e) {
    return 'ad' + e;
  }));

  events = events.concat(events.map(function(e) {
    return 'content' + e;
  }));

  this.player.on(events, (e) => {
    var str = e.type;
    if (this.player.ads.isInAdMode()) {
      if (this.player.ads.isContentResuming()) {
        seenInContentResuming.push(str);
      } else {
        seenInAdMode.push(str);
      }
    } else {
      if (beforePreroll) {
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

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {

      seenOutsideAdModeBefore.forEach((event) => {
        assert.ok(!/^ad/.test(event), event + ' has no ad prefix before preroll');
        assert.ok(!/^content/.test(event), event + ' has no content prefix before preroll');
      });

      seenInAdMode.forEach((event) => {
        assert.ok(/^ad/.test(event), event + ' has ad prefix during preroll');
      });

      seenInContentResuming.forEach((event) => {
        assert.ok(/^content/.test(event), event + ' has content prefix during preroll');
      });

      seenOutsideAdModeAfter.forEach((event) => {
        assert.ok(!/^ad/.test(event), event + ' has no ad prefix after preroll');
        assert.ok(!/^content/.test(event), event + ' has no content prefix after preroll');
      });

      done();
    }
  });

  this.player.play();

});
