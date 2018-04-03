QUnit.module('Integration: play middleware', window.sharedModuleHooks({
  beforeEach: function() {
    this.video.play = function() {
      this.player.trigger('play');
    };
  }
}));

QUnit.test('the `_playRequested` flag is set on the first play request', function(assert) {
  const spy = sinon.spy();
  const done = assert.async();

  this.player.on('contentchanged', spy);

  videojs.log('first loadstart');
  this.player.trigger('loadstart');
  this.player.trigger('adsready');
  assert.strictEqual(this.player.ads._playRequested, false,
    'initially set to false');
  assert.strictEqual(this.player.ads.isInAdMode(), false,
    'starts in a content state');

  videojs.log('first play');
  this.player.trigger('play');
  assert.strictEqual(this.player.ads._playRequested, true,
    '_playRequested is now true');
  assert.strictEqual(this.player.ads.isInAdMode(), true,
    'now in ad state');

  // Reset temporarily
  this.player.src('http://media.w3.org/2010/05/sintel/trailer.mp4');

  videojs.log('second loadstart');
  this.player.trigger('loadstart');
  assert.strictEqual(this.player.ads._playRequested, false,
    '_playRequested reset');
  assert.strictEqual(spy.callCount, 1,
    'contentchanged once');

  this.clock.tick(1);

  const testAssert = function(player, clock) {
    assert.strictEqual(player.ads._playRequested, true,
      '_playRequested is true when the play method is used too');
    done();
  };

  // could be a play promise
  videojs.log('second play');
  const playResult = this.player.play();

  this.clock.tick(1);

  if (playResult && typeof playResult.then === 'function') {
    playResult.then(() => {
      this.clock.tick(1);
      testAssert(this.player, this.clock);
    });
  } else {
    testAssert(this.player, this.clock);
  }
});