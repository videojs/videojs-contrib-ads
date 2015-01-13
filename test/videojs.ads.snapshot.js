var
  video,
  oldTimeout,
  player,
  contentPlaybackFired,
  contentPlaybackReason;

module('Ad Framework - Video Snapshot', {
  setup: function() {
    videojs.Html5.isSupported = function() {
      return true;
    };
    delete videojs.Html5.prototype.setSource;

    var captionTrack = document.createElement('track'),
        otherTrack = document.createElement('track');

    captionTrack.setAttribute('kind', 'captions');
    captionTrack.setAttribute('src', 'testcaption.vtt');
    otherTrack.setAttribute('src', 'testcaption.vtt');

    var noop = function() {};
    video = document.createElement('div');
    video.load = function() {};
    video.play = function() {};

    // phantom has a non-functional version of removeAttribute
    if (/phantom/i.test(window.navigator.userAgent)) {
      video.removeAttribute = function(attr) {
        video[attr] = '';
      };
    }

    video.appendChild(captionTrack);
    video.appendChild(otherTrack);

    document.getElementById('qunit-fixture').appendChild(video);
    player = videojs(video);
    player.buffered = function() {
      return videojs.createTimeRange(0, 0);
    };
    player.ended = function() {
      return false;
    };
    video.load = noop;
    video.play = noop;
    player.ads();

    oldTimeout = window.setTimeout;

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
    window.setTimeout = oldTimeout;
  }
});

test('restores the original video src after ads', function() {
  var originalSrc = player.currentSrc();

  player.trigger('adsready');
  player.trigger('play');

  player.trigger('adstart');
  player.src('//example.com/ad.mp4');
  player.trigger('adend');

  equal(originalSrc, player.currentSrc(), 'the original src is restored');
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
  player.src('//example.com/ad.mp4');

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
  player.src('//example.com/ad.mp4');

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
  player.src('//example.com/ad.mp4');

  // the ad resets the current time
  video.currentTime = 0;
  player.trigger('adend');
  player.trigger('loadedmetadata');

  equal(video.currentTime, 100, 'currentTime was restored');
});

test('only restores the player snapshot if the src changed', function() {
  var
    playCalled = false,
    srcModified = false,
    currentTimeModified = false;

  player.trigger('adsready');
  player.trigger('play');

  // spy on relevant player methods
  player.play = function() {
    playCalled = true;
  };
  player.src = function(url) {
    if (url === undefined) {
      return video.src;
    }
    srcModified = true;
  };
  player.currentTime = function(time) {
    if (time !== undefined) {
      currentTimeModified = true;
    }
  };

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  player.trigger('adstart');
  player.trigger('adend');

  ok(!srcModified, 'the src was reset');
  ok(playCalled, 'content playback resumed');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  // the src wasn't changed, so we shouldn't be waiting on loadedmetadata to
  // update the currentTime
  player.trigger('loadedmetadata');
  ok(!currentTimeModified, 'no seeking occurred');
});

test('snapshot does not resume after post-roll', function() {
  var playCalled = false;

  // start playback
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');
  player.trigger('loadedmetadata');
  player.trigger('adsready');
  player.trigger('play');

  // spy on relevant player methods
  player.play = function() {
    playCalled = true;
  };

  //trigger an ad
  player.trigger('adstart');
  player.src('//example.com/ad.mp4');
  player.trigger('loadstart');
  player.trigger('loadedmetadata');
  player.trigger('adend');

  //resume playback
  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');
  player.trigger('loadedmetadata');
  ok(playCalled, 'content playback resumed');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  playCalled = false;
  player.ended = function() {
    return true;
  };
  player.trigger('ended');
  //trigger a post-roll
  player.trigger('adstart');
  player.src('//example.com/ad.mp4');
  player.trigger('loadstart');
  player.trigger('loadedmetadata');
  player.trigger('adend');

  equal(player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  ok(!playCalled, 'content playback should not have been resumed');
  equal(contentPlaybackFired, 2, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
});

test('snapshot does not resume after burned-in post-roll', function() {
  var
    playCalled = false,
    loadCalled = false;

  player.trigger('adsready');
  player.trigger('play');

  // spy on relevant player methods
  player.play = function() {
    playCalled = true;
  };

  player.load = function() {
    loadCalled = true;
  };

  player.trigger('adstart');
  player.trigger('adend');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
  ok(playCalled, 'content playback resumed');
  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  playCalled = false;
  player.trigger('ended');
  player.ended = function() {
    return true;
  };
  //trigger a post-roll
  player.currentTime(30);
  player.trigger('adstart');
  player.currentTime(50);
  player.trigger('adend');

  equal(player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  equal(contentPlaybackFired, 2, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
  equal(player.currentTime(), 50, 'currentTime should not be reset using burned in ads');
  ok(!loadCalled, 'player.load() should not be called if the player is ended.');
  ok(!playCalled, 'content playback should not have been resumed');
});

test('snapshot does not resume after multiple post-rolls', function() {
  var playCalled = false;

  player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');
  player.trigger('loadstart');
  player.trigger('adsready');
  player.trigger('play');

  // spy on relevant player methods
  player.play = function() {
    playCalled = true;
  };

  // with a separate video display or server-side ad insertion, ads play but
  // the src never changes. Modifying the src or currentTime would introduce
  // unnecessary seeking and rebuffering
  player.trigger('adstart');
  player.trigger('adend');
  ok(playCalled, 'content playback resumed');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  // if the video ends (regardless of burned in post-roll or otherwise) when
  // stopLinearAdMode fires next we should not hit play() since we have reached
  // the end of the stream
  playCalled = false;
  player.ended = function() {
    return true;
  };
  player.trigger('ended');
  //trigger a lots o post-rolls
  player.trigger('adstart');
  player.src('http://example.com/ad1.mp4');
  player.trigger('loadstart');
  player.src('http://example.com/ad2.mp4');
  player.trigger('loadstart');
  player.trigger('adend');

  equal(player.ads.state, 'content-playback', 'Player should be in content-playback state after a post-roll');
  equal(contentPlaybackFired, 2, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');
  ok(!playCalled, 'content playback should not resume');

});

test('changing the source and then timing out does not restore a snapshot', function() {
  player.paused = function() {
    return false;
  };
  // load and play the initial video
  player.src('http://example.com/movie.mp4');
  player.trigger('loadstart');
  player.trigger('play');
  player.trigger('adsready');
  // preroll
  player.trigger('adstart');
  player.trigger('adend');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  // change the content and timeout the new ad response
  player.src('http://example.com/movie2.mp4');
  player.trigger('loadstart');
  player.trigger('adtimeout');

  equal(player.ads.state,
        'content-playback',
        'playing the new content video after the ad timeout');
  equal(contentPlaybackFired, 2, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adtimeout', 'The reason for content-playback should have been adtimeout');

  equal('http://example.com/movie2.mp4',
        player.currentSrc(),
        'playing the second video');
});

// changing the src attribute to a URL that AdBlocker is intercepting
// doesn't update currentSrc, so when restoring the snapshot we
// should check for src attribute modifications as well
test('checks for a src attribute change that isn\'t reflected in currentSrc', function() {
  var updatedSrc;
  player.currentSrc = function() {
    return 'content.mp4';
  };
  player.currentType = function() {
    return 'video/mp4';
  };

  player.trigger('adsready');
  player.trigger('play');
  player.trigger('adstart');

  player.src = function(source) {
    if (source === undefined) {
      return 'ad.mp4';
    }
    updatedSrc = source;
  };
  player.trigger('adend');
  equal(contentPlaybackFired, 1, 'A content-playback event should have triggered');
  equal(contentPlaybackReason, 'adend', 'The reason for content-playback should have been adend');

  deepEqual(updatedSrc, {
    src: 'content.mp4',
    type: 'video/mp4'
  }, 'restored src attribute');
});

test('When captions are enabled, the video\'s tracks will be disabled during the ad', function() {
  var tracks = player.remoteTextTracks(),
      showing = 0,
      disabled = 0,
      i;

  ok(tracks.length > 0, 'No tracks detected');

  player.trigger('adsready');
  player.trigger('play');

  // set all modes to 'showing'
  for (i = 0; i < tracks.length; i++) {
    tracks[i].mode = 'showing';
  }

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'showing') {
      showing++;
    }
  }

  equal(showing, tracks.length, 'all tracks should be showing');
  showing = 0;

  player.trigger('adstart');

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'disabled') {
      disabled++;
    }
  }

  equal(disabled, tracks.length, 'all tracks should be disabled');

  player.trigger('adend');

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].mode === 'showing') {
      showing++;
    }
  }

  equal(showing, tracks.length, 'all tracks should be showing');
});
