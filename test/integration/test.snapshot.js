import videojs from 'video.js';
import * as snapshot from '../../src/snapshot.js';

QUnit.module('Video Snapshot', window.sharedModuleHooks({

  beforeEach: function() {
    var captionTrack = document.createElement('track');
    var otherTrack = document.createElement('track');

    captionTrack.setAttribute('kind', 'captions');
    captionTrack.setAttribute('src', 'lib/testcaption.vtt');
    otherTrack.setAttribute('src', 'lib/testcaption.vtt');
    this.video.appendChild(captionTrack);
    this.video.appendChild(otherTrack);

    this.player.ended = function() {
      return false;
    };
  }
}));

QUnit.test('restores the original video src after ads', function(assert) {
  var originalSrc = 'http://example.com/original.mp4';

  assert.expect(1);

  this.player.src(originalSrc);

  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.currentSrc(), originalSrc, 'the original src is restored');
});

QUnit.test('waits for the video to become seekable before restoring the time', function(assert) {
  var setTimeoutSpy;

  assert.expect(2);

  this.player.trigger('adsready');
  this.player.trigger('play');

  // the video plays to time 100
  setTimeoutSpy = sinon.spy(window, 'setTimeout');
  this.video.currentTime = 100;
  this.player.ads.startLinearAdMode();
  this.player.src('//example.com/ad.mp4');

  // the ad resets the current time
  this.video.currentTime = 0;
  this.player.ads.endLinearAdMode();
  setTimeoutSpy.reset(); // we call setTimeout an extra time restorePlayerSnapshot
  this.player.trigger('canplay');
  assert.strictEqual(setTimeoutSpy.callCount, 1, 'restoring the time should be delayed');
  assert.strictEqual(this.video.currentTime, 0, 'currentTime is not modified');
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
  var playSpy, srcSpy, currentTimeSpy;

  this.player.trigger('adsready');
  this.player.trigger('play');
  playSpy = sinon.spy(this.player, 'play');
  srcSpy = sinon.spy(this.player, 'src');
  currentTimeSpy = sinon.spy(this.player, 'currentTime');

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  assert.ok(playSpy.called, 'content playback resumed');
  assert.ok(srcSpy.alwaysCalledWithExactly(), 'the src was not reset');

  this.player.trigger('playing');

  // the src wasn't changed, so we shouldn't be waiting on loadedmetadata to
  // update the currentTime
  this.player.trigger('loadedmetadata');
  assert.ok(currentTimeSpy.alwaysCalledWithExactly(), 'no seeking occurred');
});

QUnit.test('snapshot does not resume playback after post-rolls', function(assert) {
  var playSpy = sinon.spy(this.player, 'play');

  // start playback
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('loadedmetadata');
  this.player.trigger('adsready');
  this.player.tech_.trigger('play');

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

  // "canplay" causes the `restorePlayerSnapshot` function in the plugin
  // to be called. This causes content playback to be resumed after 20
  // attempts of a 50ms timeout (20 * 50 == 1000).
  this.clock.tick(1000);
  assert.strictEqual(playSpy.callCount, 1, 'content playback resumed');

  this.player.trigger('playing');

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
  assert.strictEqual(playSpy.callCount, 0, 'content playback should not have been resumed');
});

QUnit.test('snapshot does not resume playback after a burned-in post-roll', function(assert) {
  var playSpy, loadSpy;

  this.player.trigger('adsready');
  this.player.trigger('play');
  playSpy = sinon.spy(this.player, 'play');
  loadSpy = sinon.spy(this.player, 'load');
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
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
  assert.strictEqual(this.player.currentTime(), 50, 'currentTime should not be reset using burned in ads');
  assert.notOk(loadSpy.called, 'player.load() should not be called if the player is ended.');
  assert.notOk(playSpy.called, 'content playback should not have been resumed');
});

QUnit.test('snapshot does not resume playback after multiple post-rolls', function(assert) {
  var playSpy;

  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('adsready');
  this.player.trigger('play');
  playSpy = sinon.spy(this.player, 'play');

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  this.player.ads.startLinearAdMode();
  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.ok(playSpy.called, 'content playback resumed');

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
  assert.notOk(playSpy.called, 'content playback should not resume');
});

QUnit.test('changing the source and then timing out does not restore a snapshot', function(assert) {

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

  // change the content and timeout the new ad response
  this.player.src('http://example.com/movie2.mp4');
  this.player.trigger('loadstart');
  this.player.trigger('adtimeout');
  assert.strictEqual('http://example.com/movie2.mp4', this.player.currentSrc(), 'playing the second video');
});

// changing the src attribute to a URL that AdBlocker is intercepting
// doesn't update currentSrc, so when restoring the snapshot we
// should check for src attribute modifications as well
QUnit.test('checks for a src attribute change that isn\'t reflected in currentSrc', function(assert) {
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

  // `src` gets called internally to set the source back to its original
  // value when the player snapshot is restored when `endLinearAdMode`
  // is called.
  this.player.tech_.src = function(source) {
    if (source === undefined) {
      return 'ad.mp4';
    }
    updatedSrc = source;
  };

  this.player.src = function(source) {
    if (source === undefined) {
      return 'ad.mp4';
    }
    updatedSrc = source;
  };


  this.player.ads.endLinearAdMode();
  this.player.trigger('playing');
  assert.deepEqual(updatedSrc, {src: 'content.mp4', type: 'video/mp4'}, 'restored src attribute');
});

QUnit.test('When captions are enabled, the video\'s tracks will be disabled during the ad', function(assert) {
  const trackSrc = 'http://solutions.brightcove.com/' +
      'bcls/captions/adding_captions_to_videos_french.vtt';

  // Add a text track
  this.player.addRemoteTextTrack({
    kind: 'captions',
    language: 'fr',
    label: 'French',
    src: trackSrc
  });

  var tracks = this.player.textTracks ? this.player.textTracks() : [];
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

  // Track mode should be restored after the ad ends
  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'showing') {
      showing++;
    }
  }

  assert.strictEqual(showing, tracks.length, 'all tracks should be showing');
});

QUnit.test('No snapshot if duration is Infinity', function(assert) {
  var originalSrc = 'foobar';
  var newSrc = 'barbaz';

  this.player.duration(Infinity);

  this.player.src(originalSrc);
  this.player.trigger('adsready');
  this.player.trigger('play');
  this.player.ads.startLinearAdMode();
  this.player.src(newSrc);
  this.player.ads.endLinearAdMode();
  assert.strictEqual(this.player.currentSrc(), newSrc, 'source is not reset');
});

QUnit.test('Snapshot and text tracks', function(assert) {
  const trackSrc = 'http://solutions.brightcove.com/' +
    'bcls/captions/adding_captions_to_videos_french.vtt';
  const originalAddTrack = this.player.addTextTrack;
  const originalTextTracks = this.player.textTracks;

  // No text tracks at start
  assert.equal(this.player.textTracks().length, 0);

  this.player.addTextTrack('captions', 'Spanish', 'es');

  // Add a text track
  this.player.addRemoteTextTrack({
    kind: 'captions',
    language: 'fr',
    label: 'French',
    src: trackSrc
  });

  // Make sure both track modes are 'showing', since it's 'disabled' by default
  this.player.textTracks()[0].mode = 'showing';
  this.player.textTracks()[1].mode = 'showing';

  // Text track looks good
  assert.equal(this.player.textTracks().length, 2);
  assert.equal(this.player.textTracks()[0].kind, 'captions');
  assert.equal(this.player.textTracks()[0].language, 'es');
  assert.equal(this.player.textTracks()[0].mode, 'showing');

  assert.equal(this.player.remoteTextTrackEls().trackElements_[0].src, trackSrc);
  assert.equal(this.player.textTracks()[1].kind, 'captions');
  assert.equal(this.player.textTracks()[1].language, 'fr');
  assert.equal(this.player.textTracks()[1].mode, 'showing');

  // Do a snapshot, as if an ad is starting
  this.player.ads.snapshot = snapshot.getPlayerSnapshot(this.player);

  // Snapshot reflects the text track
  assert.equal(this.player.ads.snapshot.suppressedTracks.length, 2);
  assert.equal(this.player.ads.snapshot.suppressedTracks[0].track.kind, 'captions');
  assert.equal(this.player.ads.snapshot.suppressedTracks[0].track.language, 'es');
  assert.equal(this.player.ads.snapshot.suppressedTracks[0].mode, 'showing');

  assert.equal(this.player.ads.snapshot.suppressedTracks[1].track.kind, 'captions');
  assert.equal(this.player.ads.snapshot.suppressedTracks[1].track.language, 'fr');
  assert.equal(this.player.ads.snapshot.suppressedTracks[1].mode, 'showing');

  // Meanwhile, track is intact, just disabled
  assert.equal(this.player.textTracks().length, 2);
  assert.equal(this.player.textTracks()[0].kind, 'captions');
  assert.equal(this.player.textTracks()[0].language, 'es');
  assert.equal(this.player.textTracks()[0].mode, 'disabled');

  assert.equal(this.player.remoteTextTrackEls().trackElements_[0].src, trackSrc);
  assert.equal(this.player.textTracks()[1].kind, 'captions');
  assert.equal(this.player.textTracks()[1].language, 'fr');
  assert.equal(this.player.textTracks()[1].mode, 'disabled');

  // Double check that the track remains disabled after 3s
  this.clock.tick(3000);
  assert.equal(this.player.textTracks()[0].mode, 'disabled');
  assert.equal(this.player.textTracks()[1].mode, 'disabled');

  // Restore the snapshot, as if an ad is ending
  snapshot.restorePlayerSnapshot(this.player, this.player.ads.snapshot);

  // Everything is back to normal
  assert.equal(this.player.textTracks().length, 2);
  assert.equal(this.player.textTracks()[0].kind, 'captions');
  assert.equal(this.player.textTracks()[0].language, 'es');
  assert.equal(this.player.textTracks()[0].mode, 'showing');
  
  assert.equal(this.player.remoteTextTrackEls().trackElements_[0].src, trackSrc);
  assert.equal(this.player.textTracks()[1].kind, 'captions');
  assert.equal(this.player.textTracks()[1].language, 'fr');
  assert.equal(this.player.textTracks()[1].mode, 'showing');

  // Resetting mocked methods
  this.player.addTextTrack = originalAddTrack;
  this.player.textTracks = originalTextTracks;
});
