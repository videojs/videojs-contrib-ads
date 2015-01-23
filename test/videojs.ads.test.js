var
  video,
  oldSetImmediate,
  oldClearImmediate,
  contentPlaybackFired,
  contentPlaybackReason,
  player;

test('the environment is sane', function() {
  ok(true, 'true is ok');
});

module('Ad Framework', {
  setup: function() {
    // fake out Html5 support
    videojs.Html5.isSupported = function() {
      return true;
    };
    delete videojs.Html5.prototype.setSource;

    video = document.createElement('video');
    video.load = function() {};
    video.play = function() {};

    // phantom has a non-functional version of removeAttribute
    if (/phantom/i.test(window.navigator.userAgent)) {
      video.removeAttribute = function(attr) {
        video[attr] = '';
      };
    }

    document.getElementById('qunit-fixture').appendChild(video);
    player = videojs(video);

    player.buffered = function() {
      return videojs.createTimeRange(0, 0);
    };
    video = player.el().querySelector('.vjs-tech');
    player.ads();

    // make setImmediate synchronous
    oldSetImmediate = window.setImmediate;
    window.setImmediate = function(callback) {
      callback.call(window);
    };

    // save clearImmediate so it can be restored after tests run
    oldClearImmediate = window.clearImmediate;

    // contentPlaybackFired is used to validate that we are left
    // in a playback state due to aderror, adscanceled, and adend
    // conditions.
    contentPlaybackFired = 0;
    player.on('contentplayback', function(event){
      contentPlaybackFired++;
      contentPlaybackReason = event.triggerevent;
    });
  },
  teardown: function() {
    window.setImmediate = oldSetImmediate;
    window.clearImmediate = oldClearImmediate;
  }
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
  var callback;
  expect(3);
  // capture setImmediate callbacks to manipulate invocation order
  window.setImmediate = function(cb) {
    callback = cb;
    return 1;
  };
  window.clearImmediate = function(id) {
    callback = null;
    equal(player.ads.cancelPlayTimeout,
          id,
          'the cancel-play timeout is cancelled');
  };

  player.trigger('play');
  player.trigger('adsready');
  equal(1, player.ads.cancelPlayTimeout, 'a cancel-play is scheduled');

  player.trigger('adstart');
  equal(player.ads.state, 'ad-playback', 'ads are playing');
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
  equal(contentPlaybackFired, 1, 'A contentplayback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The triggerevent for content-playback should have been adtimeout');
});

test('waits for adsready if play is received first', function() {
  player.trigger('play');
  player.trigger('adsready');
  equal(player.ads.state, 'preroll?', 'the state is preroll?');
});

test('moves to content-playback if a plugin does not finish initializing', function() {
  player.trigger('play');
  player.trigger('adtimeout');
  equal(player.ads.state,
        'content-playback',
        'the state is content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The triggerevent for content-playback should have been adtimeout');
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
  equal(contentPlaybackFired, 1, 'A contentplayback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The triggerevent for content-playback should have been adend');
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
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The reason for content-playback should have been adtimeout');
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
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The reason for content-playback should have been adtimeout');
});

test('removes the poster attribute so it does not flash between videos', function() {
  video.poster = 'http://www.videojs.com/img/poster.jpg';
  ok(video.poster, 'the poster is present initially');

  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');

  equal(video.poster, '', 'poster is removed');
  ok(!contentPlaybackFired, 'A content-playback event should not have triggered');
});

test('restores the poster attribute after ads have ended', function() {
  video.poster = 'http://www.videojs.com/img/poster.jpg';
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');
  player.trigger('adend');

  ok(video.poster, 'the poster is restored');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
});

test('changing the src triggers contentupdate', function() {

  // track contentupdate events
  var contentupdates = 0;
  player.on('contentupdate', function(){
    contentupdates++;
  });

  // set src and trigger synthetic 'loadstart'
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');

  // confirm one contentupdate event
  equal(contentupdates, 1, 'one contentupdate event fired');

});

test('changing src does not trigger contentupdate during ad playback', function() {

  // track contentupdate events
  var contentupdates = 0;
  player.on('contentupdate', function(){
    contentupdates++;
  });

  // enter ad playback mode
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');

  // set src and trigger synthetic 'loadstart'
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');

  // finish playing ad
  player.trigger('adend');

  // confirm one contentupdate event
  equal(contentupdates, 0, 'no contentupdate events fired');

  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
});

test('contentSrc can be modified to avoid src changes triggering contentupdate', function() {
  var contentupdates = 0;

  // load a low bitrate rendition
  player.src('http://example.com/movie-low.mp4');
  player.trigger('loadstart');
  equal(player.ads.contentSrc,
        player.currentSrc(),
        'captures the current content src');

  // track contentupdate events
  player.on('contentupdate', function(){
    contentupdates++;
  });

  // play an ad
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');
  player.trigger('adend');

  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  // notify ads that the contentSrc is changing
  player.ads.contentSrc = 'http://example.com/movie-high.mp4';
  player.src('http://example.com/movie-high.mp4');
  player.trigger('loadstart');

  equal(contentupdates, 0, 'no contentupdate was generated');
  equal(player.ads.state, 'content-playback', 'did not reset ad state');
  equal(player.ads.contentSrc,
        player.currentSrc(),
        'captures the current content src');
});

test('the cancel-play timeout is cleared when exiting "preroll?"', function() {
  var callbacks = [];
  expect(3);

  // capture setImmediate callbacks to manipulate invocation order
  window.setImmediate = function(callback) {
    callbacks.push(callback);
    return callbacks.length;
  };

  player.trigger('adsready');
  player.trigger('play');

  equal('preroll?', player.ads.state, 'the player is waiting for prerolls');

  player.trigger('play');
  equal(1, callbacks.length, 'a single cancel-play is registered');

  callbacks[0](); // run the cancel-play
  callbacks.length = 0;

  player.trigger('play');
  player.trigger('play');
  player.trigger('play');
  equal(1, callbacks.length, 'a single cancel-play is registered');
});

test('adscanceled allows us to transition from content-set to content-playback', function() {
  equal(player.ads.state, 'content-set');
  player.trigger('adscanceled');

  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adscanceled', 'The reason for content-playback should have been adscanceled');
});

test('adscanceled allows us to transition from ads-ready? to content-playback', function() {
  var callback;
  expect(8);
  // capture setImmediate callbacks to manipulate invocation order
  window.setImmediate = function(cb) {
    callback = cb;
    return 1;
  };
  window.clearImmediate = function(id) {
    callback = null;
    equal(player.ads.cancelPlayTimeout,
          id,
          'the cancel-play timeout is cancelled');
  };

  equal(player.ads.state, 'content-set');

  player.trigger('play');
  equal(player.ads.state, 'ads-ready?');
  equal(player.ads.cancelPlayTimeout, 1);

  player.trigger('adscanceled');
  equal(player.ads.state, 'content-playback');
  equal(callback, null);

  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adscanceled', 'The reason for content-playback should have been adscanceled');
});

test('adserror in content-set transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adserror in ads-ready? transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('play');
  equal(player.ads.state, 'ads-ready?');
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adserror in ads-ready transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adserror in preroll? transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  equal(player.ads.state, 'preroll?');
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adserror in ad-playback transitions to content-playback and triggers adend', function(){
  expect(6);
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adstart');

  player.on('adend', function(event) {
    equal(event.type, 'adend', 'adend should be fired when we enter content-playback from adserror');
  });

  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adsready in content-playback triggers readyforpreroll', function(){
  expect(6);

  player.on('readyforpreroll', function(event) {
    equal(event.type, 'readyforpreroll', 'readyforpreroll should have been triggered.');
  });

  equal(player.ads.state, 'content-set');
  player.trigger('play');
  equal(player.ads.state, 'ads-ready?');
  player.trigger('adtimeout');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The reason for content-playback should have been adtimeout');
  player.trigger('adsready');

});
