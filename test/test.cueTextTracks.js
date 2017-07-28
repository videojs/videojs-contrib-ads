QUnit.module('Cue Metadata Text Tracks', window.sharedModuleHooks({

  beforeEach: function() {
    this.tt = {
      player: this.player,
      kind: 'metadata',
      mode: 'hidden',
      id: '1',
      startTime: 1,
      endTime: 2,
      addEventListener: function(event, cb) {
        if (event === 'cuechange') {
          cb.apply(this, [this]);
        }
      },
      activeCues: []
    };
  },
  afterEach: function() {
    this.player.ads.cueTextTracks.getSupportedAdCue = function(player, cue) {
      return cue;
    };
    this.player.ads.cueTextTracks.getCueId = function(cue) {
      return cue.id;
    };
    this.player.ads.cueTextTracks.setMetadataTrackMode = function(track) {
      track.mode = 'hidden';
    };
  }
}));

QUnit.test('runs processMetadataTrack callback as tracks are added', function(assert) {
  var tt = this.tt;
  var processMetadataTrackSpy = sinon.spy();
  var cueTextTracks = this.player.ads.cueTextTracks;

  // Start by adding a text track before processing
  this.player.addRemoteTextTrack(tt);

  cueTextTracks.processMetadataTracks(this.player, processMetadataTrackSpy);
  assert.strictEqual(processMetadataTrackSpy.callCount, 1);

  // add a new text track after initial processing
  this.player.textTracks().trigger({
    track: this.tt,
    type: 'addtrack'
  });
  assert.strictEqual(processMetadataTrackSpy.callCount, 2);
});

QUnit.test('does not call processMetadataTrack callback until tracks available', function(assert) {
  var processMetadataTrackSpy = sinon.spy();
  var cueTextTracks = this.player.ads.cueTextTracks;

  cueTextTracks.processMetadataTracks(this.player, processMetadataTrackSpy);
  assert.strictEqual(processMetadataTrackSpy.callCount, 0);

  var addTrackEvent = {
    track: this.tt,
    type: 'addtrack'
  };
  this.player.textTracks().trigger(addTrackEvent);
  assert.strictEqual(processMetadataTrackSpy.callCount, 1);
});

QUnit.test('setMetadataTrackMode should work when overriden', function(assert) {
  var tt = this.tt;
  var cueTextTracks = this.player.ads.cueTextTracks;

  cueTextTracks.setMetadataTrackMode(tt);
  assert.strictEqual(tt.mode, 'hidden');

  cueTextTracks.setMetadataTrackMode = function(track) {
    track.mode = 'disabled';
  };
  cueTextTracks.setMetadataTrackMode(tt);
  assert.strictEqual(tt.mode, 'disabled');
});

QUnit.test('getSupportedAdCue should work when overriden', function(assert) {
  var cue = {
    startTime: 0,
    endTime: 1
  };

  var cueTextTracks = this.player.ads.cueTextTracks;
  var supportedCue = cueTextTracks.getSupportedAdCue(this.player, cue);
  assert.strictEqual(supportedCue, cue);

  cueTextTracks.getSupportedAdCue = function(player, cue) {
    return -1;
  };
  supportedCue = cueTextTracks.getSupportedAdCue(this.player, cue);
  assert.strictEqual(supportedCue, -1);
});

QUnit.test('getCueId should work when overriden', function(assert) {
  var cue = {
    startTime: 0,
    endTime: 1,
    id: 1,
    inner: {
      id: 2
    }
  };
  var tt = this.tt;
  tt.activeCues = [cue];

  this.player.textTracks = function() {
    return {
      length: 1,
      0: tt
    };
  };

  var cueTextTracks = this.player.ads.cueTextTracks;
  var cueId = cueTextTracks.getCueId(cue);
  assert.strictEqual(cueId, 1);

  cueTextTracks.getCueId = function(cue) {
    return cue.inner.id;
  };
  cueId = cueTextTracks.getCueId(cue);
  assert.strictEqual(cueId, 2);
});

QUnit.test('processAdTrack runs processCue callback', function(assert) {
  var processCueSpy = sinon.spy();
  var cueTextTracks = this.player.ads.cueTextTracks;
  var cues = [{
    startTime: 0,
    endTime: 1,
    id: 1,
    callCount: 0
  }];

  cueTextTracks.processAdTrack(this.player, cues, processCueSpy);
  assert.strictEqual(processCueSpy.callCount, 1);

  var processCue = function(player, cueData, cueId, startTime) {
    cueData.callCount += 1;
  };
  cueTextTracks.processAdTrack(this.player, cues, processCue);
  assert.strictEqual(cues[0].callCount, 1);
});

QUnit.test('processAdTrack runs cancelAds callback', function(assert) {
  var cancelAdsSpy = sinon.spy();
  var cueTextTracks = this.player.ads.cueTextTracks;
  var cues = [{
    startTime: 0,
    endTime: 1,
    id: 1,
    callCount: 0
  }];
  var processCue = function(player, cueData, cueId, startTime) {
    return;
  };
  var cancelAds = function(player, cueData, cueId, startTime) {
    cueData.callCount += 1;
  };

  cueTextTracks.processAdTrack(this.player, cues, processCue, cancelAdsSpy);
  assert.strictEqual(cancelAdsSpy.callCount, 1);

  cueTextTracks.processAdTrack(this.player, cues, processCue, cancelAds);
  assert.strictEqual(cues[0].callCount, 1);
});
