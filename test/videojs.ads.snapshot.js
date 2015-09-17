QUnit.module('Video Snapshot', window.sharedModuleHooks({

  beforeEach: function() {
    var captionTrack = document.createElement('track');
    var otherTrack = document.createElement('track');
    captionTrack.setAttribute('kind', 'captions');
    captionTrack.setAttribute('src', 'testcaption.vtt');
    otherTrack.setAttribute('src', 'testcaption.vtt');
    this.video.appendChild(captionTrack);
    this.video.appendChild(otherTrack);

    this.player.ended = function() {
      return false;
    };
  }
}));

QUnit.test('restores the original video src after ads', function(assert) {
  assert.expect(1);
  var originalSrc = this.player.currentSrc();
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.currentSrc(), originalSrc, 'the original src is restored');
});

QUnit.test('waits for the video to become seekable before restoring the time', function(assert) {
  assert.expect(2);
  this.video.seekable = [];
  this.player.trigger('adsready');
  this.player.trigger('play');

  // the video plays to time 100
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');
  this.video.currentTime = 100;
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');

  // the ad resets the current time
  this.video.currentTime = 0;
  this.player.ads.endLinearAdMode();
  this.player.trigger('canplay');
  assert.strictEqual(setTimeoutSpy.callCount, 1, 'restoring the time should be delayed');
  assert.strictEqual(this.video.currentTime, 0, 'currentTime is not modified');
  window.setTimeout.restore();
});

QUnit.test('tries to restore the play state up to 20 times', function(assert) {
  assert.expect(1);
  this.video.seekable = [];
  this.player.trigger('adsready');
  this.player.trigger('play');

  // the video plays to time 100
  this.video.currentTime = 100;
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');

  // the ad resets the current time
  this.video.currentTime = 0;
  this.player.ads.endLinearAdMode();
  this.player.trigger('canplay');

  // We expect 20 timeouts at 50ms each.
  this.clock.tick(1000);

  // This expectation was previously 20, but as of video.js 5.0 there appear
  // to be two more setTimeout calls.
  assert.strictEqual(setTimeoutSpy.callCount, 20, 'seekable was tried multiple times');
  window.setTimeout.restore();
});

QUnit.test('the current time is restored at the end of an ad', function(assert) {
  assert.expect(1);
  this.player.trigger('adsready');
  this.video.currentTime = 100;
  this.player.trigger('play');

  // the video plays to time 100
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');

  // the ad resets the current time
  this.video.currentTime = 0;
  this.player.ads.endLinearAdMode();
  this.player.trigger('canplay');
  this.clock.tick(1000);
  assert.strictEqual(this.video.currentTime, 100, 'currentTime was restored');
});

QUnit.test('only restores the player snapshot if the src changed', function(assert) {
  assert.expect(5);
  this.player.trigger('adsready');
  this.player.trigger('play');
  var playSpy = sinon.spy(this.player, 'play');
  var srcSpy = sinon.spy(this.player, 'src');
  var currentTimeSpy = sinon.spy(this.player, 'currentTime');

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  assert.ok(playSpy.called, 'content playback resumed');
  assert.ok(srcSpy.alwaysCalledWithExactly(), 'the src was reset');
  this.player.trigger('playing');
  assert.ok(this.contentPlaybackSpy.calledOnce, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');

  // the src wasn't changed, so we shouldn't be waiting on loadedmetadata to
  // update the currentTime
  this.player.trigger('loadedmetadata');
  assert.ok(currentTimeSpy.alwaysCalledWithExactly(), 'no seeking occurred');
});

QUnit.test('snapshot does not resume playback after post-rolls', function(assert) {
  assert.expect(7);

  // start playback
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('loadedmetadata');
  this.player.trigger('adsready');
  this.player.trigger('play');
  var playSpy = sinon.spy(this.player, 'play');

  // trigger an ad
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('loadedmetadata');
  this.player.ads.endLinearAdMode();

  // resume playback
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('canplay');
  this.clock.tick(1000);
  assert.strictEqual(playSpy.callCount, 1, 'content playback resumed');
  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');

  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  this.player.ended = function() {
    return true;
  };

  this.player.trigger('ended');
  playSpy.reset();

  // trigger a post-roll
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('loadedmetadata');
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  assert.strictEqual(playSpy.callCount, 0, 'content playback should not have been resumed');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
});

QUnit.test('snapshot does not resume playback after a burned-in post-roll', function(assert) {
  assert.expect(9);
  this.player.trigger('adsready');
  this.player.trigger('play');
  var playSpy = sinon.spy(this.player, 'play');
  var loadSpy = sinon.spy(this.player, 'load');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.ok(this.contentPlaybackSpy.calledOnce, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
  assert.ok(playSpy.called, 'content playback resumed');

  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  this.player.ended = function() {
    return true;
  };

  this.player.trigger('ended');
  playSpy.reset();

  // trigger a post-roll
  this.player.currentTime(30);
  this.player.ads.startLinearAdMode();
  this.player.currentTime(50);
  this.player.ads.endLinearAdMode();
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
  assert.strictEqual(this.player.currentTime(), 50, 'currentTime should not be reset using burned in ads');
  assert.notOk(loadSpy.called, 'player.load() should not be called if the player is ended.');
  assert.notOk(playSpy.called, 'content playback should not have been resumed');
});

QUnit.test('snapshot does not resume playback after multiple post-rolls', function(assert) {
  assert.expect(7);
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('adsready');
  this.player.trigger('play');
  var playSpy = sinon.spy(this.player, 'play');

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.ok(playSpy.called, 'content playback resumed');
  assert.ok(this.contentPlaybackSpy.calledOnce, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');

  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  this.player.ended = function() {
    return true;
  };

  this.player.trigger('ended');
  playSpy.reset();

  // trigger a lot of post-rolls
  this.player.ads.startLinearAdMode();
  this.player.src('http://example.com/ad1.mp4');
  this.player.trigger('loadstart');
  this.player.src('http://example.com/ad2.mp4');
  this.player.trigger('loadstart');
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  this.player.trigger('ended');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have been triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'ended', 'The reason for content-playback should have been ended');
  assert.notOk(playSpy.called, 'content playback should not resume');
});

// "ended" does not fire when the end of a video is seeked to directly in iOS 8.1
QUnit.test('does resume playback after postrolls if "ended" does not fire naturally', function(assert) {
  assert.expect(2);

  // play the video
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.trigger('adtimeout');

  // finish the video and watch for play()
  this.player.ended = function() {
    return true;
  };

  this.player.trigger('ended');

  // play a postroll
  this.player.ads.startLinearAdMode();
  this.player.src('http://example.com/ad1.mp4');
  this.player.ads.endLinearAdMode();

  // reload the content video while capturing timeouts
  var setTimeoutSpy = sinon.spy(window, 'setTimeout');
  this.player.trigger('contentcanplay');
  assert.strictEqual(setTimeoutSpy.callCount, 1, 'set a timeout to check for "ended"');

  // trigger any registered timeouts
  var playSpy = sinon.spy(this.player, 'play');
  this.clock.tick(10000);
  assert.strictEqual(playSpy.callCount, 1, 'called play() to trigger an "ended"');
});

QUnit.test('changing the source and then timing out does not restore a snapshot', function(assert) {
  assert.expect(6);

  this.player.paused = function() {
    return false;
  };

  // load and play the initial video
  this.player.src('http://example.com/movie.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('play');
  this.player.trigger('adsready');

  // preroll
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');

  // change the content and timeout the new ad response
  this.player.src('http://example.com/movie2.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('adtimeout');
  assert.strictEqual(this.player.ads.state, 'content-playback', 'playing the new content video after the ad timeout');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 2, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(1), 'adtimeout', 'The reason for content-playback should have been adtimeout');
  assert.strictEqual('http://example.com/movie2.mp4', this.player.currentSrc(), 'playing the second video');
});

// changing the src attribute to a URL that AdBlocker is intercepting
// doesn't update currentSrc, so when restoring the snapshot we
// should check for src attribute modifications as well
QUnit.test('checks for a src attribute change that isn\'t reflected in currentSrc', function(assert) {
  assert.expect(3);
  var updatedSrc;

  this.player.currentSrc = function() {
    return 'content.mp4';
  };

  this.player.currentType = function() {
    return 'video/mp4';
  };

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();

  this.player.src = function(source) {
    if (source === undefined) {
      return 'ad.mp4';
    }
    updatedSrc = source;
  };

  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.strictEqual(this.contentPlaybackSpy.callCount, 1, 'A content-playback event should have triggered');
  assert.strictEqual(this.contentPlaybackReason(), 'playing', 'The reason for content-playback should have been playing');
  assert.deepEqual(updatedSrc, {src: 'content.mp4', type: 'video/mp4'}, 'restored src attribute');
});

QUnit.test('When captions are enabled, the video\'s tracks will be disabled during the ad', function(assert) {
  var tracks = this.player.remoteTextTracks ? this.player.remoteTextTracks() : [];
  var showing = 0;
  var disabled = 0;
  var i;

  if (tracks.length <= 0) {
    assert.expect(0);
    videojs.log.warn('Did not detect text track support, skipping');
    return;
  }

  assert.expect(3);
  this.player.trigger('adsready');
  this.player.trigger('play');

  // set all modes to 'showing'
  for (i = 0; i < tracks.length; i++) {
    tracks[i].mode = 'showing';
  }

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'showing') {
      showing++;
    }
  }

  assert.strictEqual(showing, tracks.length, 'all tracks should be showing');
  showing = 0;
  this.player.ads.startLinearAdMode();

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'disabled') {
      disabled++;
    }
  }

  assert.strictEqual(disabled, tracks.length, 'all tracks should be disabled');
  this.player.ads.endLinearAdMode();

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'showing') {
      showing++;
    }
  }

  assert.strictEqual(showing, tracks.length, 'all tracks should be showing');
});

QUnit.test('player events during snapshot restoration are prefixed', function(assert) {
  assert.expect(2);
  var spy = sinon.spy();
  this.player.on(['contentloadstart', 'contentloadedmetadata'], spy);

  this.player.src({
    src: 'http://example.com/movie.mp4',
    type: 'video/mp4'
  });

  this.player.on('readyforpreroll', videojs.bind(this, function() {
    this.player.ads.startLinearAdMode();
  }));

  this.player.trigger('adsready');
  this.player.trigger('play');

  // change the source to an ad
  this.player.src({
    src: 'http://example.com/ad.mp4',
    type: 'video/mp4'
  });

  this.player.trigger('loadstart');
  assert.strictEqual(spy.callCount, 0, 'did not fire contentloadstart');
  this.player.ads.endLinearAdMode();

  // make it appear that the tech is ready to seek
  this.player.trigger('loadstart');
  this.player.el().querySelector('.vjs-tech').seekable = [1];
  this.player.trigger('loadedmetadata');
  assert.strictEqual(spy.callCount, 2, 'fired "content" prefixed events');
});
