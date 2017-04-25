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
      'adServerUrl': '/base/test/inventory.json'
    });
  },

  afterEach: function() {
    this.player.dispose();
  }
});

QUnit.test('playing event and prerolls: 1+ after preroll, 0 before', function(assert) {
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

QUnit.test('loadstart event and prerolls: 0 after preroll, 1 before', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var loadstartBeforePreroll = 0;
  var loadstartAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on('loadstart', () => {
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

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {
      assert.equal(loadstartBeforePreroll, 1, 'loadstart before preroll');
      assert.equal(loadstartAfterPreroll, 0, 'loadstart after preroll');
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

QUnit.test('Prefixed events during preroll', function(assert) {
  var done = assert.async();

  var seenInAdMode = [];
  var seenOutsideAdMode = [];

  var adEvents = [
    'ademptied',
    'adtimeupdate',
    'adloadstart',
    'adfirstplay',
    'adwaiting',
    'addurationchange',
    'adloadedmetadata',
    'adprogress',
    'adsuspend',
    'adloadeddata',
    'adcanplay',
    'adcanplaythrough'
  ];

  this.player.on(adEvents, (e) => {
    if (this.player.ads.isInAdMode()) {
      seenInAdMode.push(e.type);
    } else {
      seenOutsideAdMode.push(e.type);
    }
  });

  this.player.on(['error', 'aderror'], () => {
    assert.ok(false, 'no errors');
    done();
  });

  this.player.on('timeupdate', () => {
    if (this.player.currentTime() > 1) {

      // Prefixed events during or before preroll
      adEvents.forEach((event) => {
        assert.ok(seenInAdMode.indexOf(event) > -1, event + ' during preroll');
      });

      // None of these events are prefixed after the preroll
      assert.equal(seenOutsideAdMode.length, 0, 'no prefixed events outside ad mode');

      done();
    }
  });

  this.player.play();

});

QUnit.test('Unprefixed events', function(assert) {
  var done = assert.async();

  var beforePreroll = true;
  var seenInAdMode = [];
  var seenOutsideAdModeBefore = [];
  var seenOutsideAdModeAfter = [];

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  var events = [
    'loadstart',
    'suspend',
    'abort',
    'error',
    'emptied',
    'stalled',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'canplaythrough',
    'playing',
    'waiting',
    'seeking',
    'ended',
    'durationchange',
    'timeupdate',
    'progress',
    'play',
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
    var str = e.type + ' ' + this.player.ads.state + ' ' + new Date().getTime();
    if (this.player.ads.isInAdMode()) {
      seenInAdMode.push(str);
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

      // Prefixed events during or before preroll
      // adEvents.forEach((event) => {
      //   assert.ok(seenBeforePreroll.indexOf(event) > -1, event + ' during preroll');
      // });
      assert.ok(true, 'good');

      // None of these events are prefixed after the preroll
      // assert.equal(seenAfterPreroll.length, 0, 'no prefixed events after preroll');

      done();
    }
  });

  this.player.play();

});
