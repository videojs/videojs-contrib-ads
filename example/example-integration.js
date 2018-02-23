/*
 * Example ad integration using the videojs-ads plugin.
 *
 * For each content video, this plugin plays one preroll and one midroll.
 * Ad content is chosen randomly from the URLs listed in inventory.json.
 */
(function(window, document, vjs, undefined) {
"use strict";

  var registerPlugin = vjs.registerPlugin || vjs.plugin;

  /*
   * Register the ad integration plugin.
   * To initialize for a player, call player.exampleAds().
   *
   * @param {mixed} options Hash of obtions for the exampleAds plugin.
   */
  registerPlugin('exampleAds', function(options){

    var

      player = this,

      // example plugin state, may have any of these properties:
      //  - inventory - hypothetical ad inventory, list of URLs to ads
      //  - lastTime - the last time observed during content playback
      //  - adPlaying - whether a linear ad is currently playing
      //  - prerollPlayed - whether we've played a preroll
      //  - midrollPlayed - whether we've played a midroll
      //  - postrollPlayed - whether we've played a postroll
      state = {},

      // just like any other video.js plugin, ad integrations can
      // accept initialization options
      adServerUrl = (options && options.adServerUrl) || "inventory.json",
      midrollPoint = (options && options.midrollPoint) || 15,
      playPreroll = options && options.playPreroll !== undefined ? options.playPreroll : true,
      playMidroll = options && options.playMidroll !== undefined ? options.playMidroll : true,
      playPostroll = options && options.playPostroll !== undefined ? options.playPostroll : true,

      // asynchronous method for requesting ad inventory
      requestAds = function() {

        // reset plugin state
        state = {};

        // fetch ad inventory
        // the 'src' parameter is ignored by the example inventory.json flat file,
        // but this shows how you might send player information along to the ad server.
        var xhr = new XMLHttpRequest();
        xhr.open("GET", adServerUrl + "?src=" + encodeURIComponent(player.currentSrc()));
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            try {
              state.inventory = JSON.parse(xhr.responseText);
              player.trigger('adsready');
            } catch (err) {
              throw new Error('Couldn\'t parse inventory response as JSON');
            }
          }
        };
        xhr.send(null);

      },

      // play an ad, given an opportunity
      playAd = function() {

        // short-circuit if we don't have any ad inventory to play
        if (!state.inventory || state.inventory.length === 0) {
          videojs.log('No inventory to play.');
          return;
        }

        // tell ads plugin we're ready to play our ad
        player.ads.startLinearAdMode();
        state.adPlaying = true;

        // tell videojs to load the ad
        var media = state.inventory[Math.floor(Math.random() * state.inventory.length)];
        player.src(media);

        // when it's finished
        player.one('adended', function() {
          // play your linear ad content, then when it's finished ...
          player.ads.endLinearAdMode();
          state.adPlaying = false;
        });

      };

    // initialize the ads plugin, passing in any relevant options
    player.ads(options);

    // request ads right away
    requestAds();

    // request ad inventory whenever the player gets content to play
    player.on('contentchanged', () => {
      requestAds();
    });

    player.on('contentended', function() {
      if (!state.postrollPlayed && playPostroll) {
        state.postrollPlayed = true;
        playAd();
      }
    });

    // play an ad the first time there's a preroll opportunity
    player.on('readyforpreroll', function() {
      if (!state.prerollPlayed && playPreroll) {
        state.prerollPlayed = true;
        playAd();
      }
    });

    // watch for time to pass 15 seconds, then play an ad
    // if we haven't played a midroll already
    player.on('timeupdate', function(event) {

      if (state.midrollPlayed) {
        return;
      }

      var currentTime = player.currentTime(), opportunity;

      if ('lastTime' in state) {
        opportunity = currentTime > midrollPoint && state.lastTime < midrollPoint;
      }

      state.lastTime = currentTime;
      if (opportunity && playMidroll) {
        state.midrollPlayed = true;
        playAd();
      }

    });

  });

})(window, document, videojs);
