/*
 * Composes per-module `beforeEach` and `afterEach` hooks with common/shared
 * hooks.
 *
 * @param  {Object} [hooks]
 * @param  {Function} [hooks.beforeEach]
 * @param  {Function} [hooks.afterEach]
 * @return {Object}
 */
window.sharedModuleHooks = (function(){
  var Html5 = videojs.getTech('Html5');

  var backup = {
    Html5: {
      isSupported: Html5.isSupported,
      setSource: Html5.prototype.setSource
    }
  };

  var common = {

    beforeEach: function() {

      // Fake HTML 5 support.
      Html5.isSupported = function() {
        return true;
      };

      delete Html5.setSource;

      // Use fake timers to replace setTimeout and so forth.
      this.clock = sinon.useFakeTimers();

      // Create video element and player.
      this.video = document.createElement('video');

      // backfill broken phantom implementation(s)
      if (/phantom/i.test(window.navigator.userAgent)) {
        this.video.removeAttribute = function(attr) {
          this[attr] = '';
        };
        this.video.load = function(){};
        this.video.play = function(){};
        this.video.pause = function(){};
      }

      document.getElementById('qunit-fixture').appendChild(this.video);

      this.player = videojs(this.video);

      // Tick the clock because videojs player creation is now async.
      this.clock.tick(1000);

      this.player.buffered = function() {
        return videojs.createTimeRange(0, 0);
      };

      this.player.ads();
    },

    afterEach: function() {

      // Restore original state of the Html5 component.
      Html5.isSupported = backup.Html5.isSupported;
      Html5.prototype.setSource = backup.Html5.setSource;

      // Restore setTimeout et al.
      this.clock.restore();

      // Kill the player and its element (i.e. `this.video`).
      this.player.dispose();

      // Kill the "contentplayback" spy.
      this.contentPlaybackSpy = this.contentPlaybackReason = null;
    }
  };

  return function(hooks) {
    hooks = hooks || {};
    return {
      beforeEach: _.flow(common.beforeEach, hooks.beforeEach || _.noop),
      afterEach: _.flow(common.afterEach, hooks.afterEach || _.noop)
    };
  };
}());

