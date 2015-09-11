/**
 * Composes per-module `beforeEach` and `afterEach` hooks with common/shared
 * hooks.
 *
 * @param  {Object} [hooks]
 * @param  {Function} [hooks.beforeEach]
 * @param  {Function} [hooks.afterEach]
 * @return {Object}
 */
window.sharedModuleHooks = (function(){
  var Html5 = videojs.getComponent('Html5');

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

      // Spy on the player's "contentplayback" event.
      this.contentPlaybackSpy = sinon.spy();
      this.player.on('contentplayback', this.contentPlaybackSpy);

      /**
       * Convenience function for getting at the reason a "contentplayback"
       * event was fired (i.e. its `triggerevent` property).
       *
       * @param  {Number} [n=0]
       *         The spy call number.
       * @return {String|null}
       *         The reason or null if none was found.
       */
      this.contentPlaybackReason = function(n) {
        var call = this.contentPlaybackSpy.getCall(n || 0);
        if (call) {
          var event = call.args[0];
          if (event && event.triggerevent) {
            return event.triggerevent;
          }
        }
        return null;
      };
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

  function toArray(x) {
    return Array.prototype.slice.apply(x);
  }

  return function(hooks) {
    return {
      beforeEach: function() {
        var args = toArray(arguments);
        common.beforeEach.apply(this, args);
        if (hooks && typeof hooks.beforeEach === 'function') {
          hooks.beforeEach.apply(this, args);
        }
      },
      afterEach: function() {
        var args = toArray(arguments);
        common.afterEach.apply(this, args);
        if (hooks && typeof hooks.afterEach === 'function') {
          hooks.afterEach.apply(this, args);
        }
      }
    };
  };
}());

