(function(window, QUnit) {

var timerExists = function(env, keyOrId) {
  var timerId = _.isNumber(keyOrId) ? keyOrId : env.player.ads[String(keyOrId)];
  return env.clock.timers.hasOwnProperty(String(timerId));
};

QUnit.module('Ad Framework', window.sharedModuleHooks());

QUnit.test('begins in content-set', function(assert) {
  assert.expect(1);
  assert.strictEqual(this.player.ads.state, 'content-set');
});

QUnit.test('pauses to wait for prerolls when the plugin loads before play', function(assert) {
  var spy = sinon.spy(this.player, 'pause');

  assert.expect(1);

  this.player.paused = function() {
    return false;
  };

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.clock.tick(1);
  this.player.trigger('play');
  this.clock.tick(1);
  assert.strictEqual(spy.callCount, 2, 'play attempts are paused');
});

QUnit.test('pauses to wait for prerolls when the plugin loads after play', function(assert) {
  var pauseSpy;

  assert.expect(1);

  this.player.paused = function() {
    return false;
  };

  pauseSpy = sinon.spy(this.player, 'pause');
  this.player.trigger('play');
  this.clock.tick(1);
  this.player.trigger('play');
  this.clock.tick(1);
  assert.equal(pauseSpy.callCount, 2, 'play attempts are paused');
});

QUnit.test('stops canceling play events when an ad is playing', function(assert) {
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');

  assert.expect(10);

  // Throughout this test, we check both that the expected timeouts are
  // populated on the `clock` _and_ that `setTimeout` has been called the
  // expected number of times.
  assert.notOk(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` does not exist');
  assert.notOk(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` does not exist');

  this.player.trigger('play');
  assert.strictEqual(setTimeoutSpy.callCount, 2, 'two timers were created (`cancelPlayTimeout` and `adTimeoutTimeout`)');
  assert.ok(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` exists');
  assert.ok(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` exists');

  this.player.trigger('adsready');
  assert.strictEqual(setTimeoutSpy.callCount, 3, '`adTimeoutTimeout` was re-scheduled');
  assert.ok(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` exists');

  this.player.trigger('adstart');
  assert.strictEqual(this.player.ads.state, 'ad-playback', 'ads are playing');
  assert.notOk(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` no longer exists');
  assert.notOk(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` no longer exists');

  window.setTimeout.restore();
});

QUnit.test('adstart is fired before a preroll', function(assert) {
  var spy = sinon.spy();

  assert.expect(1);

  this.player.on('adstart', spy);
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  assert.strictEqual(spy.callCount, 1, 'a preroll triggers adstart');
});

QUnit.test('player has the .vjs-has-started class once a preroll begins', function(assert) {
  assert.expect(1);
  this.player.trigger('adsready');

  // This is a bit of a hack in order to not need the test to be async.
  this.player.tech_.trigger('play');
  this.player.ads.startLinearAdMode();
  assert.ok(this.player.hasClass('vjs-has-started'), 'player has .vjs-has-started class');
});

QUnit.test('moves to content-playback after a preroll', function(assert) {
  assert.expect(2);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'content-resuming', 'the state is content-resuming');

  this.player.trigger('playing');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'the state is content-resuming');
});

QUnit.test('moves to ad-playback if a midroll is requested', function(assert) {
  assert.expect(1);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback', 'the state is ad-playback');
});

QUnit.test('moves to content-playback if the preroll times out', function(assert) {
  assert.expect(3);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'the state is content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A contentplayback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adtimeout', 'The triggerevent for content-playback should have been adtimeout');
});

QUnit.test('waits for adsready if play is received first', function(assert) {
  assert.expect(1);

  this.player.trigger('play');
  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'preroll?', 'the state is preroll?');
});

QUnit.test('moves to content-playback if a plugin does not finish initializing', function(assert) {
  assert.expect(3);

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'the state is content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adtimeout', 'The triggerevent for content-playback should have been adtimeout');
});

QUnit.test('calls start immediately on play when ads are ready', function(assert) {
  var spy = sinon.spy();

  assert.expect(1);

  this.player.on('readyforpreroll', spy);
  this.player.trigger('adsready');
  this.player.trigger('play');
  assert.strictEqual(spy.callCount, 1, 'readyforpreroll was fired');
});

QUnit.test('adds the ad-mode class when a preroll plays', function(assert) {
  var el;

  assert.expect(1);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  el = this.player.el();
  assert.ok(this.player.hasClass('vjs-ad-playing'), 'the ad class should be in "' + el.className + '"');
});

QUnit.test('removes the ad-mode class when a preroll finishes', function(assert) {
  var el;

  assert.expect(5);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  el = this.player.el();
  assert.notOk(this.player.hasClass('vjs-ad-playing'), 'the ad class should not be in "' + el.className + '"');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 0, 'did not fire contentplayback yet');
  assert.strictEqual(this.player.ads.triggerevent, 'adend', 'triggerevent for content-resuming should have been adend');

  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A contentplayback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The triggerevent for content-playback should have been playing');
});

QUnit.test('adds a class while waiting for an ad plugin to load', function(assert) {
  var el;

  assert.expect(1);

  this.player.trigger('play');
  el = this.player.el();
  assert.ok(this.player.hasClass('vjs-ad-loading'), 'the ad loading class should be in "' + el.className + '"');
});

QUnit.test('adds a class while waiting for a preroll', function(assert) {
  var el;

  assert.expect(1);

  this.player.trigger('adsready');
  this.player.trigger('play');
  el = this.player.el();
  assert.ok(this.player.hasClass('vjs-ad-loading'), 'the ad loading class should be in "' + el.className + '"');
});

QUnit.test('removes the loading class when the preroll begins', function(assert) {
  var el;

  assert.expect(1);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  el = this.player.el();
  assert.notOk(this.player.hasClass('vjs-ad-loading'), 'there should be no ad loading class present in "' + el.className + '"');
});

QUnit.test('removes the loading class when the preroll times out', function(assert) {
  var el;

  assert.expect(3);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');
  el = this.player.el();
  assert.notOk(this.player.hasClass('vjs-ad-loading'), 'there should be no ad loading class present in "' + el.className + '"');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adtimeout', 'The reason for content-playback should have been adtimeout');
});

QUnit.test('starts the content video if there is no preroll', function(assert) {
  var spy = sinon.spy(this.player, 'play');

  assert.expect(3);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.clock.tick(1);
  this.player.trigger('adtimeout');
  assert.strictEqual(spy.callCount, 1, 'play is called once');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adtimeout', 'The reason for content-playback should have been adtimeout');
});

QUnit.test('removes the poster attribute so it does not flash between videos', function(assert) {
  assert.expect(3);

  this.video.poster = 'http://www.videojs.com/img/poster.jpg';
  assert.ok(this.video.poster, 'the poster is present initially');

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.video.poster, '', 'poster is removed');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 0, 'A content-playback event should not have triggered');
});

QUnit.test('restores the poster attribute after ads have ended', function(assert) {
  assert.expect(3);

  this.video.poster = 'http://www.videojs.com/img/poster.jpg';
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  assert.ok(this.video.poster, 'the poster is restored');

  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
});

QUnit.test('changing the src triggers "contentupdate"', function(assert) {
  var spy = sinon.spy();

  assert.expect(1);

  this.player.on('contentupdate', spy);

  // set src and trigger synthetic 'loadstart'
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  assert.strictEqual(spy.callCount, 1, 'one contentupdate event fired');
});

QUnit.test('"contentupdate" should fire when src is changed in "content-resuming" state after postroll', function(assert) {
  var spy = sinon.spy();

  assert.expect(2);

  this.player.on('contentupdate', spy);
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  this.player.trigger('adtimeout');
  this.player.ads.snapshot.ended = true;

  // set src and trigger synthetic 'loadstart'
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  assert.strictEqual(spy.callCount, 1, 'one contentupdate event fired');
  assert.strictEqual(this.player.ads.state, 'content-set', 'we are in the content-set state');
});

QUnit.test('"contentupdate" should fire when src is changed in "content-playback" state after postroll', function(assert) {
  var spy = sinon.spy();

  assert.expect(2);

  this.player.on('contentupdate', spy);
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  this.player.trigger('adtimeout');
  this.player.ads.snapshot.ended = true;
  this.player.trigger('ended');

  // set src and trigger synthetic 'loadstart'
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  assert.strictEqual(spy.callCount, 1, 'one contentupdate event fired');
  assert.strictEqual(this.player.ads.state, 'content-set', 'we are in the content-set state');
});

QUnit.test('changing src does not trigger "contentupdate" during ad playback', function(assert) {
  var spy = sinon.spy();

  assert.expect(4);

  this.player.on('contentupdate', spy);

  // enter ad playback mode
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();

  // set src and trigger synthetic 'loadstart'
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');

  // finish playing ad
  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 0, 'no contentupdate events fired');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 0, 'A content-playback event should not have triggered');

  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
});

QUnit.test('`contentSrc` can be modified to avoid src changes triggering "contentupdate"', function(assert) {
  var spy = sinon.spy();

  assert.expect(6);

  // load a low bitrate rendition
  this.player.src('http://example.com/movie-low.mp4');
  this.player.trigger('loadstart');
  assert.strictEqual(this.player.ads.contentSrc, this.player.currentSrc(), 'captures the current content src');

  this.player.on('contentupdate', spy);

  // play an ad
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');

  // notify ads that the contentSrc is changing
  this.player.ads.contentSrc = 'http://example.com/movie-high.mp4';
  this.player.src('http://example.com/movie-high.mp4');
  this.player.trigger('loadstart');
  assert.strictEqual(spy.callCount, 0, 'no contentupdate was generated');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'did not reset ad state');
  assert.strictEqual(this.player.ads.contentSrc, this.player.currentSrc(), 'captures the current content src');
});

QUnit.test('the `cancelPlayTimeout` timeout is cleared when exiting "preroll?"', function(assert) {
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');

  assert.expect(5);

  this.player.trigger('adsready');
  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'preroll?', 'the player is waiting for prerolls');
  assert.strictEqual(setTimeoutSpy.callCount, 2, 'two timers were created (`cancelPlayTimeout` and `adTimeoutTimeout`)');
  assert.ok(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` exists');
  assert.ok(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` exists');

  this.player.trigger('play');
  this.player.trigger('play');
  this.player.trigger('play');
  assert.strictEqual(setTimeoutSpy.callCount, 2, 'no additional timers were created on subsequent "play" events');

  window.setTimeout.restore();
});

QUnit.test('"adscanceled" allows us to transition from "content-set" to "content-playback"', function(assert) {
  assert.expect(4);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adscanceled');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adscanceled', 'The reason for content-playback should have been adscanceled');
});

QUnit.test('"adscanceled" allows us to transition from "ads-ready?" to "content-playback"', function(assert) {
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');

  assert.expect(9);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'ads-ready?');
  assert.strictEqual(setTimeoutSpy.callCount, 2, 'two timers were created (`cancelPlayTimeout` and `adTimeoutTimeout`)');
  assert.ok(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` exists');
  assert.ok(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` exists');

  this.player.trigger('adscanceled');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.notOk(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` was canceled');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, '"content-playback" event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adscanceled', 'reason for "content-playback" should have been "adscanceled"');

  window.setTimeout.restore();
});

QUnit.test('content is resumed on contentplayback if a user initiated play event is canceled', function(assert) {
  var playSpy = sinon.spy(this.player, 'play');
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');

  assert.expect(8);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'ads-ready?');
  assert.strictEqual(setTimeoutSpy.callCount, 2, 'two timers were created (`cancelPlayTimeout` and `adTimeoutTimeout`)');
  assert.ok(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` exists');
  assert.ok(timerExists(this, 'adTimeoutTimeout'), '`adTimeoutTimeout` exists');

  this.clock.tick(1);
  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.notOk(timerExists(this, 'cancelPlayTimeout'), '`cancelPlayTimeout` was canceled');
  assert.strictEqual(playSpy.callCount, 1, 'a play event should be triggered once we enter "content-playback" state if on was canceled.');
});

QUnit.test('adserror in content-set transitions to content-playback', function(assert) {
  assert.expect(4);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adserror', 'The reason for content-playback should have been adserror');
});

QUnit.test('adskip in content-set transitions to content-playback', function(assert) {
  assert.expect(4);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adskip');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adskip', 'The reason for content-playback should have been adskip');
});

QUnit.test('adserror in ads-ready? transitions to content-playback', function(assert) {
  assert.expect(5);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'ads-ready?');

  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adserror', 'The reason for content-playback should have been adserror');
});

QUnit.test('adskip in ads-ready? transitions to content-playback', function(assert) {
  assert.expect(5);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'ads-ready?');

  this.player.trigger('adskip');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adskip', 'The reason for content-playback should have been adskip');
});

QUnit.test('adserror in ads-ready transitions to content-playback', function(assert) {
  assert.expect(5);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adserror', 'The reason for content-playback should have been adserror');
});

QUnit.test('adskip in ads-ready transitions to content-playback', function(assert) {
  assert.expect(5);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('adskip');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adskip', 'The reason for content-playback should have been adskip');
});

QUnit.test('adserror in preroll? transitions to content-playback', function(assert) {
  assert.expect(6);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'preroll?');

  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adserror', 'The reason for content-playback should have been adserror');
});

QUnit.test('adskip in preroll? transitions to content-playback', function(assert) {
  assert.expect(6);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'preroll?');

  this.player.trigger('adskip');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adskip', 'The reason for content-playback should have been adskip');
});

QUnit.test('adserror in postroll? transitions to content-playback and fires ended', function(assert) {
  assert.expect(8);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'postroll?');

  this.player.ads.snapshot.ended = true;
  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(this.player.ads.triggerevent, 'adserror', 'adserror should be the trigger event');

  this.clock.tick(1);
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'Two content-playback events should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
  assert.strictEqual(this.player.ads.state, 'content-playback');
});

QUnit.test('adtimeout in postroll? transitions to content-playback and fires ended', function(assert) {
  assert.expect(8);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'postroll?');

  this.player.ads.snapshot.ended = true;
  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(this.player.ads.triggerevent, 'adtimeout', 'adtimeout should be the trigger event');

  this.clock.tick(1);
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
  assert.strictEqual(this.player.ads.state, 'content-playback');
});

QUnit.test('adskip in postroll? transitions to content-playback and fires ended', function(assert) {
  assert.expect(8);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'postroll?');

  this.player.ads.snapshot.ended = true;
  this.player.trigger('adskip');
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(this.player.ads.triggerevent, 'adskip', 'adskip should be the trigger event');

  this.clock.tick(1);
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
  assert.strictEqual(this.player.ads.state, 'content-playback');
});

QUnit.test('an "ended" event is fired in "content-resuming" via a timeout if not fired naturally', function(assert) {
  var endedSpy = sinon.spy();

  assert.expect(6);

  this.player.on('ended', endedSpy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'postroll?');

  this.player.ads.startLinearAdMode();
  this.player.ads.snapshot.ended = true;
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(endedSpy.callCount, 0, 'we should not have gotten an ended event yet');

  this.clock.tick(1000);
  assert.strictEqual(endedSpy.callCount, 1, 'we should have fired ended from the timeout');
});

QUnit.test('an "ended" event is not fired in "content-resuming" via a timeout if fired naturally', function(assert) {
  var endedSpy = sinon.spy();

  assert.expect(6);

  this.player.on('ended', endedSpy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'postroll?');

  this.player.ads.startLinearAdMode();
  this.player.ads.snapshot.ended = true;
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(endedSpy.callCount, 0, 'we should not have gotten an ended event yet');

  this.player.trigger('ended');
  assert.strictEqual(endedSpy.callCount, 1, 'we should have fired ended from the timeout');
});

QUnit.test('adserror in ad-playback transitions to content-playback and triggers adend', function(assert) {
  var spy;

  assert.expect(8);

  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');

  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  spy = sinon.spy();
  this.player.on('adend', spy);
  this.player.trigger('adserror');
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(this.player.ads.triggerevent, 'adserror', 'The reason for content-resuming should have been adserror');

  this.player.trigger('playing');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
  assert.strictEqual(spy.getCall(0).args[0].type, 'adend', 'adend should be fired when we enter content-playback from adserror');
});

QUnit.test('calling startLinearAdMode() when already in ad-playback does not trigger adstart', function(assert) {
  var spy = sinon.spy();

  this.player.on('adstart', spy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  // go through preroll flow
  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'preroll?');

  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback');
  assert.strictEqual(spy.callCount, 1, 'adstart should have fired');

  // add an extraneous start call
  this.player.ads.startLinearAdMode();
  assert.strictEqual(spy.callCount, 1, 'adstart should not have fired');

  // make sure subsequent adstarts trigger again on exit/re-enter
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.strictEqual(this.player.ads.state, 'content-playback');

  this.player.ads.startLinearAdMode();
  assert.strictEqual(spy.callCount, 2, 'adstart should have fired');
});

QUnit.test('calling endLinearAdMode() in any state but ad-playback does not trigger adend', function(assert) {
  var spy;

  assert.expect(13);

  spy = sinon.spy();
  this.player.on('adend', spy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 0, 'adend should not have fired');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 0, 'adend should not have fired');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'preroll?');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 0, 'adend should not have fired');

  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-playback');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 0, 'adend should not have fired');

  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(spy.callCount, 1, 'adend should have fired');

  this.player.trigger('playing');
  assert.strictEqual(this.player.ads.state, 'content-playback');

  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback');

  this.player.trigger('adserror');
  assert.strictEqual(spy.callCount, 2, 'adend should have fired');
});

QUnit.test('skipLinearAdMode in ad-playback does not trigger adskip', function(assert) {
  var spy;

  assert.expect(10);

  spy = sinon.spy();
  this.player.on('adskip', spy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads.state, 'ads-ready');

  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback');

  this.player.ads.skipLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'ad-playback');
  assert.strictEqual(spy.callCount, 0, 'adskip event should not trigger when skipLinearAdMode called in ad-playback state');

  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.ads.state, 'content-resuming');
  assert.strictEqual(this.player.ads.triggerevent, 'adend', 'The reason for content-resuming should have been adend');

  this.player.trigger('playing');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
});

QUnit.test('adsready in content-playback triggers readyforpreroll', function(assert) {
  var spy;

  assert.expect(6);

  spy = sinon.spy();
  this.player.on('readyforpreroll', spy);
  assert.strictEqual(this.player.ads.state, 'content-set');

  this.player.trigger('play');
  assert.strictEqual(this.player.ads.state, 'ads-ready?');

  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-playback');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'adtimeout', 'The reason for content-playback should have been adtimeout');

  this.player.trigger('adsready');
  assert.strictEqual(spy.getCall(0).args[0].type, 'readyforpreroll', 'readyforpreroll should have been triggered.');
});

// ----------------------------------
// Event prefixing during ad playback
// ----------------------------------

QUnit.test('player events during prerolls are prefixed', function(assert) {
  var prefixed, unprefixed;

  assert.expect(2);

  prefixed = sinon.spy();
  unprefixed = sinon.spy();

  // play a preroll
  this.player.on('readyforpreroll', function() {
    this.ads.startLinearAdMode();
  });

  this.player.trigger('play');
  this.player.trigger('adsready');

  // simulate video events that should be prefixed
  this.player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], unprefixed);
  this.player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], prefixed);
  this.player.trigger('firstplay');
  this.player.trigger('loadstart');
  this.player.trigger('playing');
  this.player.trigger('loadedalldata');
  this.player.trigger('pause');
  this.player.trigger('ended');
  assert.strictEqual(unprefixed.callCount, 0, 'no unprefixed events fired');
  assert.strictEqual(prefixed.callCount, 6, 'prefixed events fired');
});

QUnit.test('player events during midrolls are prefixed', function(assert) {
  var prefixed, unprefixed;

  assert.expect(2);

  prefixed = sinon.spy();
  unprefixed = sinon.spy();

  // play a midroll
  this.player.trigger('play');
  this.player.trigger('adsready');
  this.player.trigger('adtimeout');
  this.player.ads.startLinearAdMode();

  // simulate video events that should be prefixed
  this.player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], unprefixed);
  this.player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], prefixed);
  this.player.trigger('firstplay');
  this.player.trigger('loadstart');
  this.player.trigger('playing');
  this.player.trigger('loadedalldata');
  this.player.trigger('pause');
  this.player.trigger('ended');
  assert.strictEqual(unprefixed.callCount, 0, 'no unprefixed events fired');
  assert.strictEqual(prefixed.callCount, 6, 'prefixed events fired');
});

QUnit.test('player events during postrolls are prefixed', function(assert) {
  var prefixed, unprefixed;

  assert.expect(2);

  prefixed = sinon.spy();
  unprefixed = sinon.spy();

  // play a postroll
  this.player.trigger('play');
  this.player.trigger('adsready');
  this.player.trigger('adtimeout');
  this.player.trigger('ended');
  this.player.ads.startLinearAdMode();

  // simulate video events that should be prefixed
  this.player.on(['loadstart', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], unprefixed);
  this.player.on(['adloadstart', 'adplaying', 'adpause', 'adended', 'adfirstplay', 'adloadedalldata'], prefixed);
  this.player.trigger('firstplay');
  this.player.trigger('loadstart');
  this.player.trigger('playing');
  this.player.trigger('loadedalldata');
  this.player.trigger('pause');
  this.player.trigger('ended');
  assert.strictEqual(unprefixed.callCount, 0, 'no unprefixed events fired');
  assert.strictEqual(prefixed.callCount, 6, 'prefixed events fired');
});

QUnit.test('player events during content playback are not prefixed', function(assert) {
  var prefixed, unprefixed;

  assert.expect(3);

  prefixed = sinon.spy();
  unprefixed = sinon.spy();

  // play content
  this.player.trigger('play');
  this.player.trigger('adsready');
  this.player.trigger('adtimeout');
  this.player.trigger('playing');
  this.player.trigger('loadedalldata');

  // simulate video events that should not be prefixed
  this.player.on(['seeked', 'playing', 'pause', 'ended', 'firstplay', 'loadedalldata'], unprefixed);
  this.player.on(['adseeked', 'adplaying', 'adpause', 'adended', 'contentended', 'adfirstplay', 'adloadedalldata'], prefixed);
  this.player.trigger('firstplay');
  this.player.trigger('seeked');
  this.player.trigger('playing');
  this.player.trigger('loadedalldata');
  this.player.trigger('pause');
  this.player.trigger('ended');
  assert.strictEqual(unprefixed.callCount, 5, 'unprefixed events fired');
  assert.strictEqual(prefixed.callCount, 1, 'prefixed events fired');
  assert.strictEqual(prefixed.getCall(0).args[0].type, 'contentended', 'prefixed the ended event');
});

QUnit.test('startLinearAdMode should only trigger adstart from correct states', function(assert) {

  var adstart = sinon.spy();
  this.player.on('adstart', adstart);

  this.player.ads.state = 'preroll?';
  this.player.ads.startLinearAdMode();
  assert.strictEqual(adstart.callCount, 1, 'preroll? state');

  this.player.ads.state = 'content-playback';
  this.player.ads.startLinearAdMode();
  assert.strictEqual(adstart.callCount, 2, 'content-playback state');

  this.player.ads.state = 'postroll?';
  this.player.ads.startLinearAdMode();
  assert.strictEqual(adstart.callCount, 3, 'postroll? state');

  this.player.ads.state = 'content-set';
  this.player.ads.startLinearAdMode();
  this.player.ads.state = 'ads-ready?';
  this.player.ads.startLinearAdMode();
  this.player.ads.state = 'ads-ready';
  this.player.ads.startLinearAdMode();
  this.player.ads.state = 'ad-playback';
  this.player.ads.startLinearAdMode();
  assert.strictEqual(adstart.callCount, 3, 'other states');
});

}(window, window.QUnit));
