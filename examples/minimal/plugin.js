var player = videojs('examplePlayer');

player.ads(); // initialize videojs-contrib-ads

// request ads whenever there's new video content
player.on('contentchanged', function() {
  // in a real plugin, you might fetch your ad inventory here
  player.trigger('adsready');
});

player.on('readyforpreroll', function() {
  player.ads.startLinearAdMode();
  // play your linear ad content
  // in this example, we use a static mp4
  player.src('kitteh.mp4');

  // send event when ad is playing to remove loading spinner
  player.one('adplaying', function() {
    player.trigger('ads-ad-started');
  });

  // resume content when all your linear ads have finished
  player.one('adended', function() {
    player.ads.endLinearAdMode();
  });
});

player.trigger('adsready');
