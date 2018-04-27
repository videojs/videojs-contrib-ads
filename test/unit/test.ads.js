import getAds from '../../src/ads.js';

QUnit.module('Ads Object', {
  beforeEach: function() {
    this.player = {
      currentSrc: () => {},
      duration: () => {},
      on: () => {},
      one: () => {},
      ready: () => {},
      setTimeout: () => {}
    };
    this.player.ads = getAds(this.player);
    this.player.ads.settings = {};
  }
}, function() {

  /*
   * Basic live detection
   */
  QUnit.test('isLive', function(assert) {
    this.player.duration = () => 5;
    assert.equal(this.player.ads.isLive(this.player), false);

    this.player.duration = () => Infinity;
    assert.equal(this.player.ads.isLive(this.player), true);
  });

  /*
   * `contentIsLive` setting overrides live detection
   */
  QUnit.test('isLive and contentIsLive', function(assert) {
    this.player.duration = () => 5;
    this.player.ads.settings.contentIsLive = true;
    assert.equal(this.player.ads.isLive(this.player), true);

    this.player.duration = () => 5;
    this.player.ads.settings.contentIsLive = false;
    assert.equal(this.player.ads.isLive(this.player), false);

    this.player.duration = () => Infinity;
    this.player.ads.settings.contentIsLive = true;
    assert.equal(this.player.ads.isLive(this.player), true);

    this.player.duration = () => Infinity;
    this.player.ads.settings.contentIsLive = false;
    assert.equal(this.player.ads.isLive(this.player), false);
  });
});
