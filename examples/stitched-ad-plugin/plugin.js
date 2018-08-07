
// This is an example of a very simple, naive stitched ads plugin. This means
// there is a single source within which are the ads.
//
// We'll simulate a preroll for the first 5 seconds of playback, a midroll at
// 15 seconds, and a postroll.
videojs.registerPlugin('exampleStitchedAds', function(options) {
  var player = this;

  options.stitchedAds = true;

  // Initialize contrib-ads.
  player.ads(options);

  var waitForCurrentTime = function(time, fn) {
    return function waiter() {
      if (player.currentTime() < time) {
        return;
      }
      player.off(['timeupdate', 'adtimeupdate'], waiter);
      fn();
    };
  };

  var simulateEndOfAd = function(time) {
    return waitForCurrentTime(time, function() {
      player.ads.endLinearAdMode();

      // We need to tell contrib-ads that content has resumed because it
      // otherwise expects a "play" event.
      player.trigger('contentresumed');
    });
  };

  var simulateStartOfAd = function(time) {
    return waitForCurrentTime(time, function() {
      player.on('adtimeupdate', simulateEndOfAd(time + 5));
      player.ads.startLinearAdMode();
    });
  };

  // When the player is ready for a pre-roll, we'll simulate a 5 second
  // stitched ad at the start of playback.
  player.on('readyforpreroll', function() {
    simulateStartOfAd(0)();
  });

  // Simulate a mid-roll at 15 seconds.
  player.on('timeupdate', simulateStartOfAd(15));

  // Simulate a post-roll at 5 seconds from the actual end of content.
  // This is a bit strange. In reality, you'd probably want to use middleware
  // to adjust the timelines to behave more like you'd expect, but this is a
  // reasonable approximation.
  player.one('canplaythrough', function() {
    player.on('timeupdate', waitForCurrentTime(player.duration() - 5, function() {
      player.tech(true).trigger('ended');
      player.play();
    }));
  });

  player.on('readyforpostroll', function() {
    player.ads.startLinearAdMode();

    // The actual ended event will now happen during the postroll playback.
    player.one('adended', function() {
      player.ads.endLinearAdMode();
    });
  });

  player.trigger('adsready');
});
