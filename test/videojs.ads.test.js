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

test('player has the .vjs-has-started class once a preroll begins', function() {
  var el = player.el_;

  player.trigger('adsready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  notEqual(el.className.indexOf('vjs-has-started'), -1, 'player has .vjs-has-started class');
});

test('moves to content-playback after a preroll', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  player.ads.endLinearAdMode();
  equal(player.ads.state,
        'content-resuming',
        'the state is content-resuming');
  player.trigger('playing');
  equal(player.ads.state,
        'content-playback',
        'the state is content-resuming');
});

test('moves to ad-playback if a midroll is requested', function() {
  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.ads.startLinearAdMode();
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
  player.ads.startLinearAdMode();

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

  equal(contentPlaybackFired, 0, 'did not fire contentplayback yet');
  equal(player.ads.triggerevent,
        'adend',
        'triggerevent for content-resuming should have been adend');

  player.trigger('playing');
  equal(contentPlaybackFired, 1, 'A contentplayback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The triggerevent for content-playback should have been playing');
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
  player.ads.startLinearAdMode();

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
  player.ads.startLinearAdMode();

  equal(video.poster, '', 'poster is removed');
  ok(!contentPlaybackFired, 'A content-playback event should not have triggered');
});

test('restores the poster attribute after ads have ended', function() {
  video.poster = 'http://www.videojs.com/img/poster.jpg';
  player.trigger('adsready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  player.ads.endLinearAdMode();

  ok(video.poster, 'the poster is restored');
  player.trigger('playing');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The reason for content-playback should have been playing');
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

test('contentupdate should fire when src is changed in content-resuming state after postroll', function() {

  // track contentupdate events
  var contentupdates = 0;
  player.on('contentupdate', function(){
    contentupdates++;
  });

  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.trigger('ended');
  player.trigger('adtimeout');
  player.ads.snapshot.ended = true;

  // set src and trigger synthetic 'loadstart'
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');

  // confirm one contentupdate event
  equal(contentupdates, 1, 'one contentupdate event fired');
  equal(player.ads.state, 'content-set', 'we are in the content-set state');
});

test('contentupdate should fire when src is changed in content-playback state after postroll', function() {

  // track contentupdate events
  var contentupdates = 0;
  player.on('contentupdate', function(){
    contentupdates++;
  });

  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.trigger('ended');
  player.trigger('adtimeout');
  player.ads.snapshot.ended = true;
  player.trigger('ended');

  // set src and trigger synthetic 'loadstart'
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');

  // confirm one contentupdate event
  equal(contentupdates, 1, 'one contentupdate event fired');
  equal(player.ads.state, 'content-set', 'we are in the content-set state');
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
  player.ads.startLinearAdMode();

  // set src and trigger synthetic 'loadstart'
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');

  // finish playing ad
  player.ads.endLinearAdMode();

  // confirm one contentupdate event
  equal(contentupdates, 0, 'no contentupdate events fired');
  equal(contentPlaybackFired, 0, 'A content-playback event should not have triggered');

  player.trigger('playing');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The reason for content-playback should have been playing');
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
  player.ads.startLinearAdMode();
  player.ads.endLinearAdMode();
  player.trigger('playing');

  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The reason for content-playback should have been playing');

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

test('content is resumed on contentplayback if a user intiated play event is canceled', function() {
  var callback;
  expect();
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

  player.on('play', function() {
    ok(true, 'a play event should be triggered once we enter content-playback state if on was canceled.');
  });
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
});

test('adserror in content-set transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adserror');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adserror', 'The reason for content-playback should have been adserror');
});

test('adskip in content-set transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adskip');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adskip', 'The reason for content-playback should have been adskip');
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

test('adskip in ads-ready? transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('play');
  equal(player.ads.state, 'ads-ready?');
  player.trigger('adskip');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adskip', 'The reason for content-playback should have been adskip');
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

test('adskip in ads-ready transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('adskip');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adskip', 'The reason for content-playback should have been adskip');
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

test('adskip in preroll? transitions to content-playback', function(){
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  equal(player.ads.state, 'preroll?');
  player.trigger('adskip');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adskip', 'The reason for content-playback should have been adskip');
});

test('adserror in postroll? transitions to content-playback and fires ended', function(){
  var oldimmediate = window.setImmediate,
      cbs = [];
  window.setImmediate = function(cb) {
    cbs.push(cb);
  };

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adtimeout');
  cbs.pop().call(window);
  player.trigger('ended');
  equal(player.ads.state, 'postroll?');

  player.ads.snapshot.ended = true;
  player.trigger('adserror');

  equal(player.ads.state, 'content-resuming');
  equal(player.ads.triggerevent, 'adserror', 'adserror should be the trigger event');

  cbs.pop().call(window);
  equal(contentPlaybackFired, 2, 'A content-playback event should have been triggered');
  equal(contentPlaybackReason, 'ended', 'The reason for content-playback should have been ended');
  equal(player.ads.state, 'content-playback');

  window.setImmediate = oldimmediate;
});

test('adtimeout in postroll? transitions to content-playback and fires ended', function(){
  var oldimmediate = window.setImmediate,
      cbs = [];
  window.setImmediate = function(cb) {
    cbs.push(cb);
  };

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adtimeout');
  cbs.pop().call(window);
  player.trigger('ended');
  equal(player.ads.state, 'postroll?');

  player.ads.snapshot.ended = true;
  player.trigger('adtimeout');

  equal(player.ads.state, 'content-resuming');
  equal(player.ads.triggerevent, 'adtimeout', 'adtimeout should be the trigger event');

  cbs.pop().call(window);

  equal(contentPlaybackFired, 2, 'A content-playback event should have been triggered');
  equal(contentPlaybackReason, 'ended', 'The reason for content-playback should have been ended');
  equal(player.ads.state, 'content-playback');

  window.setImmediate = oldimmediate;
});

test('adskip in postroll? transitions to content-playback and fires ended', function(){
  var oldimmediate = window.setImmediate,
      cbs = [];
  window.setImmediate = function(cb) {
    cbs.push(cb);
  };

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adtimeout');
  cbs.pop().call(window);
  player.trigger('ended');
  equal(player.ads.state, 'postroll?');

  player.ads.snapshot.ended = true;
  player.trigger('adskip');

  equal(player.ads.state, 'content-resuming');
  equal(player.ads.triggerevent, 'adskip', 'adskip should be the trigger event');

  cbs.pop().call(window);

  equal(contentPlaybackFired, 2, 'A content-playback event should have been triggered');
  equal(contentPlaybackReason, 'ended', 'The reason for content-playback should have been ended');
  equal(player.ads.state, 'content-playback');

  window.setImmediate = oldimmediate;
});

test('an ended event is fired in content-resuming via a timeout if not fired naturally', function() {
  var oldtimeout = window.setTimeout,
      oldclear = window.clearTimeout,
      ended = 0,
      cbs = [];

  window.setTimeout = function(cb) {
    return cbs.push(cb) - 1;
  };
  window.clearTimeout = function(index) {
    cbs.splice(index, 1);
  };

  player.on('ended', function() {
    ended++;
  });

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.trigger('ended');
  equal(player.ads.state, 'postroll?');

  player.ads.startLinearAdMode();
  player.ads.snapshot.ended = true;
  player.ads.endLinearAdMode();

  equal(player.ads.state, 'content-resuming');

  equal(ended, 0, 'we should not have gotten an ended event yet');

  if (!/phantomjs/i.test(window.navigator.userAgent)) {
    cbs.pop().call(window);
    equal(ended, 1, 'we should have fired ended from the timeout cbs');
  }

  window.setTimeout = oldtimeout;
  window.clearTimeout = oldclear;
});

test('an ended event is not fired in content-resuming via a timeout if fired naturally', function() {
  var oldtimeout = window.setTimeout,
      oldclear = window.clearTimeout,
      ended = 0,
      cbs = [];

  window.setTimeout = function(cb) {
    return cbs.push(cb) - 1;
  };
  window.clearTimeout = function(index) {
    cbs.splice(index, 1);
  };

  player.on('ended', function() {
    ended++;
  });

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.trigger('adtimeout');
  player.trigger('ended');
  equal(player.ads.state, 'postroll?');

  player.ads.startLinearAdMode();
  player.ads.snapshot.ended = true;
  player.ads.endLinearAdMode();

  equal(player.ads.state, 'content-resuming');

  player.trigger('ended');

  equal(ended, 1, 'we got an ended event');
  equal(cbs.length, 0, 'we should have cleared the ended timeout');

  window.setTimeout = oldtimeout;
  window.clearTimeout = oldclear;
});

test('adserror in ad-playback transitions to content-playback and triggers adend', function(){
  expect(8);
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.ads.startLinearAdMode();

  player.on('adend', function(event) {
    equal(event.type, 'adend', 'adend should be fired when we enter content-playback from adserror');
  });

  player.trigger('adserror');
  equal(player.ads.state, 'content-resuming');
  equal(player.ads.triggerevent, 'adserror', 'The reason for content-resuming should have been adserror');

  player.trigger('playing');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The reason for content-playback should have been playing');
});

test('adsfallback in ad-playback transitions to adsready?', function(){
  expect(5);
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.ads.startLinearAdMode();

  player.on('adend', function(event) {
    equal(event.type, 'adend', 'adend should be fired when we enter ads-ready? from adsfallback');
  });

  player.trigger('adsfallback');
  equal(player.ads.state, 'ads-ready?');
  equal(player.ads.triggerevent, 'adsfallback', 'The reason for ads-ready? should have been adsfallback');
});

test('calling startLinearAdMode() when already in ad-playback does not trigger adstart', function(){
  var adstart = 0;
  player.on('adstart', function() {
    adstart++;
  });

  //go through preroll flow
  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  equal(player.ads.state, 'preroll?');
  player.ads.startLinearAdMode();
  equal(player.ads.state, 'ad-playback');
  equal(adstart, 1, 'adstart should have fired');

  //add an extraneous start call
  player.ads.startLinearAdMode();
  equal(adstart, 1, 'adstart should not have fired');

  //make sure subsequent adstarts trigger again on exit/re-enter
  player.ads.endLinearAdMode();
  player.trigger('playing');
  equal(player.ads.state, 'content-playback');
  player.ads.startLinearAdMode();
  equal(adstart, 2, 'adstart should have fired');
});

test('calling endLinearAdMode() in any state but ad-playback does not trigger adend', function(){
  var adend = 0;
  player.on('adend', function() {
    adend++;
  });

  equal(player.ads.state, 'content-set');
  player.ads.endLinearAdMode();
  equal(adend, 0, 'adend should not have fired');

  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.ads.endLinearAdMode();
  equal(adend, 0, 'adend should not have fired');

  player.trigger('play');
  equal(player.ads.state, 'preroll?');
  player.ads.endLinearAdMode();
  equal(adend, 0, 'adend should not have fired');

  player.trigger('adtimeout');
  equal(player.ads.state, 'content-playback');
  player.ads.endLinearAdMode();
  equal(adend, 0, 'adend should not have fired');

  player.ads.startLinearAdMode();
  equal(player.ads.state, 'ad-playback');
  player.ads.endLinearAdMode();
  equal(adend, 1, 'adend should have fired');

  player.trigger('playing');
  equal(player.ads.state, 'content-playback');
  player.ads.startLinearAdMode();
  equal(player.ads.state, 'ad-playback');
  player.trigger('adserror');
  equal(adend, 2, 'adend should have fired');
});

test('skipLinearAdMode in ad-playback does not trigger adskip', function(){
  var adskip = 0;
  player.on('adskip', function() {
    adskip++;
  });

  equal(player.ads.state, 'content-set');
  player.trigger('adsready');
  equal(player.ads.state, 'ads-ready');
  player.trigger('play');
  player.ads.startLinearAdMode();
  equal(player.ads.state, 'ad-playback');
  player.ads.skipLinearAdMode();
  equal(player.ads.state, 'ad-playback');
  equal(adskip, 0, 'adskip event should not trigger when skipLinearAdMode called in ad-playback state');

  player.ads.endLinearAdMode();
  equal(player.ads.state, 'content-resuming');
  equal(player.ads.triggerevent, 'adend', 'The reason for content-resuming should have been adend');

  player.trigger('playing');
  equal(player.ads.state, 'content-playback');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'playing', 'The reason for content-playback should have been playing');
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

// ----------------------------------
// Event prefixing during ad playback
// ----------------------------------

test('player events during prerolls are prefixed', function() {
  var prefixed = [], unprefixed = [];

  // play a preroll
  player.on('readyforpreroll', function() {
    player.ads.startLinearAdMode();
  });
  player.trigger('play');
  player.trigger('adsready');

  // simulate video events that should be prefixed
  player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], function(event) {
    unprefixed.push(event);
  });
  player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], function(event) {
    prefixed.push(event);
  });
  player.trigger('firstplay');
  player.trigger('loadstart');
  player.trigger('playing');
  player.trigger('loadedalldata');
  player.trigger('pause');
  player.trigger('ended');

  equal(unprefixed.length, 0, 'no unprefixed events fired');
  equal(prefixed.length, 6, 'prefixed events fired');
});

test('player events during midrolls are prefixed', function() {
  var prefixed = [], unprefixed = [];

  // play a midroll
  player.trigger('play');
  player.trigger('adsready');
  player.trigger('adtimeout');
  player.ads.startLinearAdMode();

  // simulate video events that should be prefixed
  player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], function(event) {
    unprefixed.push(event);
  });
  player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], function(event) {
    prefixed.push(event);
  });
  player.trigger('firstplay');
  player.trigger('loadstart');
  player.trigger('playing');
  player.trigger('loadedalldata');
  player.trigger('pause');
  player.trigger('ended');

  equal(unprefixed.length, 0, 'no unprefixed events fired');
  equal(prefixed.length, 6, 'prefixed events fired');
});
test('player events during postrolls are prefixed', function() {
  var prefixed = [], unprefixed = [];

  // play a postroll
  player.trigger('play');
  player.trigger('adsready');
  player.trigger('adtimeout');
  player.trigger('ended');
  player.ads.startLinearAdMode();

  // simulate video events that should be prefixed
  player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], function(event) {
    unprefixed.push(event);
  });
  player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], function(event) {
    prefixed.push(event);
  });
  player.trigger('firstplay');
  player.trigger('loadstart');
  player.trigger('playing');
  player.trigger('loadedalldata');
  player.trigger('pause');
  player.trigger('ended');

  equal(unprefixed.length, 0, 'no unprefixed events fired');
  equal(prefixed.length, 6, 'prefixed events fired');
});
test('player events during content playback are not prefixed', function() {
  var prefixed = [], unprefixed = [];

  // play content
  player.trigger('play');
  player.trigger('adsready');
  player.trigger('adtimeout');
  player.trigger('playing');
  player.trigger('loadedalldata');

  // simulate video events that should not be prefixed
  player.on(['seeked', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], function(event) {
    unprefixed.push(event);
  });
  player.on(['adseeked', 'adplaying', 'adpause', 'adended', 'contentended', 'adfirstplay', 'adloadedalldata'], function(event) {
    prefixed.push(event);
  });
  player.trigger('firstplay');
  player.trigger('seeked');
  player.trigger('playing');
  player.trigger('loadedalldata');
  player.trigger('pause');
  player.trigger('ended');

  equal(unprefixed.length, 5, 'unprefixed events fired');
  equal(prefixed.length, 1, 'no prefixed events fired');
  equal(prefixed[0].type, 'contentended', 'prefixed the ended event');
});
