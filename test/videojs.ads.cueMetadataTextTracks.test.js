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
    this.player.ads.metadataTextTracks.getSupportedAdCue = function(player, cue) {
      return cue;
    };
    this.player.ads.metadataTextTracks.getCueId = function(cue) {
      return cue.id;
    };
    this.player.ads.metadataTextTracks.setTrackMode = function(track) {
      track.mode = 'hidden';
    };
  }
}));

QUnit.test('runs processTrack callback as tracks are added', function(assert) {
  var tt = this.tt;
  this.player.textTracks = function() {
    return {
      length: 1,
      0: tt
    };
  };

  var processTrackSpy = sinon.spy();
  var metadataTextTracks = this.player.ads.metadataTextTracks;

  metadataTextTracks.process(this.player, processTrackSpy);
  assert.strictEqual(processTrackSpy.callCount, 1);
});

QUnit.test('does not call processTrack callback until tracks available', function(assert) {
  var processTrackSpy = sinon.spy();
  var metadataTextTracks = this.player.ads.metadataTextTracks;

  metadataTextTracks.process(this.player, processTrackSpy);
  assert.strictEqual(processTrackSpy.callCount, 0);

  var addTrackEvent = {
    track: this.tt,
    type: 'addtrack'
  };
  this.player.textTracks().trigger(addTrackEvent);
  assert.strictEqual(processTrackSpy.callCount, 1);
});

QUnit.test('setTrackMode should work when overriden', function(assert) {
  var tt = this.tt;
  var metadataTextTracks = this.player.ads.metadataTextTracks;

  metadataTextTracks.setTrackMode(tt);
  assert.strictEqual(tt.mode, 'hidden');

  metadataTextTracks.setTrackMode = function(track) {
    track.mode = 'disabled';
  };
  metadataTextTracks.setTrackMode(tt);
  assert.strictEqual(tt.mode, 'disabled');
});

QUnit.test('getSupportedAdCue should work when overriden', function(assert) {
  var cue = {
    startTime: 0,
    endTime: 1
  };

  var metadataTextTracks = this.player.ads.metadataTextTracks;
  var supportedCue = metadataTextTracks.getSupportedAdCue(this.player, cue);
  assert.strictEqual(supportedCue, cue);

  metadataTextTracks.getSupportedAdCue = function(player, cue) {
    return -1;
  };
  supportedCue = metadataTextTracks.getSupportedAdCue(this.player, cue);
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

  var metadataTextTracks = this.player.ads.metadataTextTracks;
  var cueId = metadataTextTracks.getCueId(cue);
  assert.strictEqual(cueId, 1);

  metadataTextTracks.getCueId = function(cue) {
    return cue.inner.id;
  };
  cueId = metadataTextTracks.getCueId(cue);
  assert.strictEqual(cueId, 2);
});

QUnit.test('processAdTrack runs processCue callback', function(assert) {
  var processCueSpy = sinon.spy();
  var metadataTextTracks = this.player.ads.metadataTextTracks;
  var cues = [{
    startTime: 0,
    endTime: 1,
    id: 1,
    callCount: 0
  }];

  metadataTextTracks.processAdTrack(this.player, cues, processCueSpy);
  assert.strictEqual(processCueSpy.callCount, 1);

  var processCue = function(player, cueData, cueId, startTime) {
    cueData.callCount += 1;
  };
  metadataTextTracks.processAdTrack(this.player, cues, processCue);
  assert.strictEqual(cues[0].callCount, 1);
});

QUnit.test('processAdTrack runs cancelAds callback', function(assert) {
  var cancelAdsSpy = sinon.spy();
  var metadataTextTracks = this.player.ads.metadataTextTracks;
  var cues = [{
    startTime: 0,
    endTime: 1,
    id: 1,
    callCount: 0
  }];
  var processCue = function(player, cueData, cueId, startTime) {
    return;
  };
  var cancelAds = function(player, cueData) {
    cueData.callCount += 1;
  };

  metadataTextTracks.processAdTrack(this.player, cues, processCue, cancelAdsSpy);
  assert.strictEqual(cancelAdsSpy.callCount, 1);

  metadataTextTracks.processAdTrack(this.player, cues, processCue, cancelAds);
  assert.strictEqual(cues[0].callCount, 1);
});
