var video, player, events;

module('Ad Events Tranformation', {
  setup: function() {
    video = document.createElement('video');
    video.className = 'video-js vjs-default-skin';
    video.width = '640';
    video.height = '272';
    video.setAttribute('controls', '');

    // add video element behavior to phantom's non-functioning version
    if (/phantom/i.test(window.navigator.userAgent)) {
      video.removeAttribute = function(attr) {
        video[attr] = '';
      };
      video.load = function() {};
      video.play = function() {};
    }
    document.getElementById('qunit-fixture').appendChild(video);
    player = videojs(video);
    player.exampleAds({
      midrollPoint: 2
    });

    // capture video element events during test runs
    player.on(videojs.Html5.Events, function(event) {
      events.push(event.type);
    });
    events = [];
    events.filter = function(predicate) {
      var i = this.length;
      while (i--) {
        if (predicate(this[i])) {
          this.splice(i, 1);
        }
      }
      return this;
    };

    // load a video
    player.src({
      src: '../example/sintel-low.mp4',
      type: 'video/mp4'
    });
  }
});

test('linear ads should not affect regular video playback events', function(assert) {
  var done = assert.async();
  player.on('ended', function() {
    events.filter(function(event) {
      return (event in {
        timeupdate: 1,
        progress: 1,
        waiting: 1,
        suspend: 1
      });
    });
    
    ok(events.length > 0, 'fired video events');
    deepEqual(events, [
      'loadstart', 'play', 'canplay', 'playing', 'canplaythrough', 'ended'
    ], 'events matched regular playback');
    done();
  });
  player.play();
});
