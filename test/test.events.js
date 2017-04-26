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

  var info = '';

  var beforePreroll = true;
  var loadstartBeforePreroll = 0;
  var loadstartAfterPreroll = 0;

  this.player.on('adend', () => {
    beforePreroll = false;
  });

  this.player.on(['loadstart', 'adloadstart', 'contentloadstart'], (e) => {
    info += '[' + e.type + ' ' +
      this.player.ads.isInAdMode() + ' ' +
      this.player.ads._dontPrefixNextLoadstart + '] ';
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
      videojs.log(info);
      assert.equal(loadstartBeforePreroll, 1, 'loadstart before preroll ' + info);
      assert.equal(loadstartAfterPreroll, 0, 'loadstart after preroll ' + info);
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
    'loadedmetadata',
    'loadeddata',
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
