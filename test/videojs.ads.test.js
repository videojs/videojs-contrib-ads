var
  video,
  oldSetTimeout,
  player;

module('Ad Framework', {
  setup: function() {
    // fake out Html5 support
    videojs.Html5.isSupported = function() {
      return true;
    };

    video = document.createElement('video');
    video.poster = '//example.com/poster.jpg';
    video.load = function() {};
    video.play = function() {};
    document.getElementById('qunit-fixture').appendChild(video);
    player = videojs(video);
    player.ads();

    // make setImmediate synchronous
    window.setImmediate = function(callback) {
      callback.call(window);
    };
  }
});

test('the environment is sane', function() {
  ok(true, 'true is ok');
});

test('begins in content-set', function() {
  equal(player.ads.state, 'content-set');
});

test('pauses to wait for prerolls when the plugin loads before play', function() {
  var pauses = 0;
  player.pause = function() {
    pauses++;
  };
  player.paused = function() {
    return false;
  };

  player.trigger('adsready');
  player.trigger('play');
  player.trigger('play');

  equal(2, pauses, 'play attempts are paused');
});

test('pauses to wait for prerolls when the plugin loads after play', function() {
  var pauses = 0;
  player.pause = function() {
    pauses++;
  };
  player.paused = function() {
    return false;
  };

  player.trigger('play');
  player.trigger('play');

  equal(2, pauses, 'play attempts are paused');
});

test('stops canceling play events when an ad is playing', function() {
  var callback, pauses = 0;
  // capture setImmediate callbacks to manipulate invocation order
  window.setImmediate = function(cb) {
    callback = cb;
  };
  player.paused = function() {
    return false;
  };
  player.pause = function() {
    pauses++;
  };

  player.trigger('play');
  player.trigger('adsready');
  player.trigger('adstart');
  callback();
  equal(player.ads.state, 'ad-playback', 'ads are playing');
  equal(0, pauses, 'the delayed pause is cancelled');
});

test('adstart is fired before a preroll', function() {
  var adStarts = 0;
  player.on('adstart', function() {
    adStarts++;
  });

  player.trigger('adsready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  equal(1, adStarts, 'a preroll triggers adstart');
});

test('moves to content-playback after a preroll', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');
  player.trigger('adend');
  equal(player.ads.state,
        'content-playback',
        'the state is content-playback');
});

test('moves to ad-playback if a midroll is requested', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.trigger('adstart');
  equal(player.ads.state, 'ad-playback', 'the state is ad-playback');
});

test('moves to content-playback if the preroll times out', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');
  equal(player.ads.state,
        'content-playback',
        'the state is content-playback');
});

test('waits for adsready if play is received first', function() {
  player.trigger('play');
  player.trigger('adsready');
  equal(player.ads.state, 'preroll?', 'the state is preroll?');
});

test('moves to ad-timeout-playback if a plugin doesn\'t finish initializing', function() {
  player.trigger('play');
  player.trigger('adtimeout');
  equal(player.ads.state,
        'ad-timeout-playback',
        'the state is ad-timeout-playback');
});

test('calls start immediately on play when ads are ready', function() {
  var prerolls = 0;
  player.on('readyforpreroll', function() {
    prerolls++;
  });
  player.trigger('adsready');
  player.trigger('play');
  equal(1, prerolls, 'readyforpreroll was fired');
});

test('adds the ad-mode class when a preroll plays', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');

  ok(player.el().className.indexOf('vjs-ad-playing') >= 0,
     'the ad class should be in "' + player.el().className + '"');
});

test('removes the ad-mode class when a preroll finishes', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  player.ads.endLinearAdMode();

  ok(player.el().className.indexOf('vjs-ad-playing') < 0,
     'the ad class should not be in "' + player.el().className + '"');
});

test('adds a class while waiting for an ad plugin to load', function() {
  player.trigger('play');
  
  ok(player.el().className.indexOf('vjs-ad-loading') >= 0,
     'the ad loading class should be in "' + player.el().className + '"');
});

test('adds a class while waiting for a preroll', function() {
  player.trigger('adsready');
  player.trigger('play');
  
  ok(player.el().className.indexOf('vjs-ad-loading') >= 0,
     'the ad loading class should be in "' + player.el().className + '"');
});

test('removes the loading class when the preroll begins', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');

  ok(player.el().className.indexOf('vjs-ad-loading') < 0,
     'there should be no ad loading class present');
});

test('removes the loading class when the preroll times out', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');

  ok(player.el().className.indexOf('vjs-ad-loading') < 0,
     'there should be no ad loading class present');
});

test('starts the content video if there is no preroll', function() {
  var playCount = 0;
  player.play = function() {
    playCount++;
  };
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');

  equal(1, playCount, 'play is called once');
});

test('removes the poster attribute so it doesn\t flash between videos', function() {
  ok(video.poster, 'the poster is present initially');

  player.trigger('adsready');
  player.trigger('play');

  ok(!video.poster, 'the poster is removed');
});

test('restores the poster attribute after ads have ended', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');
  player.trigger('adend');

  ok(video.poster, 'the poster is restored');
});

module('Ad Framework - Video Snapshot', {
  setup: function() {
    var noop = function() {};
    video = document.createElement('div');
    player = videojs(video);

    video.load = noop;
    video.play = noop;
    player.ads();

    // save the original setTimeout
    oldSetTimeout = window.setTimeout;
  },

  teardown: function() {
    window.setTimeout = oldSetTimeout;
  }
});

test('waits for the video to become seekable before restoring the time', function() {
  expect(2);

  var timeouts = 0;

  window.setTimeout = function() {
    timeouts++;
  };

  video.seekable = [];

  player.trigger('adsready');
  player.trigger('play');

  // the video plays to time 100
  timeouts = 0;
  video.currentTime = 100;
  player.trigger('adstart');

  // the ad resets the current time
  video.currentTime = 0;
  player.trigger('adend');
  player.trigger('loadedmetadata');

  equal(1, timeouts, 'restoring the time should be delayed');
  equal(0, video.currentTime, 'currentTime is not modified');
});

test('tries to restore the play state up to 20 times', function() {
  expect(1);

  var timeouts = 0;

  // immediately execute all timeouts
  window.setTimeout = function(callback) {
    timeouts++;
    callback();
  };

  video.seekable = [];

  player.trigger('adsready');
  player.trigger('play');

  // the video plays to time 100
  timeouts = 0;
  video.currentTime = 100;
  player.trigger('adstart');

  // the ad resets the current time
  video.currentTime = 0;
  player.trigger('adend');
  player.trigger('loadedmetadata');

  equal(20, timeouts, 'seekable was tried multiple times');
});

test('the current time is restored at the end of an ad', function() {
  expect(1);

  player.trigger('adsready');
  video.currentTime = 100;
  player.trigger('play');

  // the video plays to time 100
  player.trigger('adstart');

  // the ad resets the current time
  video.currentTime = 0;
  player.trigger('adend');
  player.trigger('loadedmetadata');

  equal(100, video.currentTime, 'currentTime was restored');
});
