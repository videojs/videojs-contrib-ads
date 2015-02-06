var video, player, events, occurInOrder, count;

// Asserts that elements in the first array occur in the same order as
// in the second array. It's okay to have duplicates or intermediate
// elements in the first array that don't occur in the second. An
// assertion will fail if all of the elements in the second array are
// not present in the first.
occurInOrder = function(actual, expected) {
  var i, j;
  for (i = j = 0; i < actual.length; i++) {
    if (actual[i] !== expected[j]) {
      continue;
    }
    equal(actual[i],
          expected[j],
          'matched "' + expected[j] + '" to event number ' + i);
    j++;
  }
  equal(j,
        expected.length,
        expected.length !== j ? 'missing ' + expected.slice(j).join(', ') : 'all expected events occurred');
};

// returns then number of elements in an array that equal the specified element.
count = function(array, element) {
  var i = array.length, result = 0;
  while (i--) {
    if (array[i] === element) {
      result++;
    }
  }
  return result;
};

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

    // capture video element events during test runs
    player.on(videojs.Html5.Events.concat(videojs.Html5.Events.map(function(event) {
      return 'ad' + event;
    })).concat(['adstart', 'adend']), function(event) {
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
  player.exampleAds({
    midrollPoint: 2
  });
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
    occurInOrder(events, [
      'play',                        // start the video
      'adstart', 'adend', 'playing', // play a preroll
      'adstart', 'adend', 'playing', // play a midroll
      'adstart', 'adend',            // play a postroll
      'pause', 'ended'               // end the video
    ]);
    occurInOrder(events, [
      'loadstart',
      'playing'
    ]);
    equal(count(events, 'loadstart'), 1, 'fired loadstart exactly once');
    equal(count(events, 'ended'), 1, 'fired ended exactly once');
    ok(player.ended(), 'the video is still ended');
    done();
  });
  player.play();
});

test('regular video playback is not affected', function(assert) {
  var done = assert.async();

  // disable ads
  player.exampleAds({
    adServerUrl: 'empty-inventory.json'
  });

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
    occurInOrder(events, [
      'play',                        // start the video
      'pause', 'ended'               // end the video
    ]);
    occurInOrder(events, [
      'loadstart',
      'playing'
    ]);
    equal(count(events, 'adstart'), 0, 'did not fire adstart');
    equal(count(events, 'adend'), 0, 'did not fire adend');
    equal(count(events, 'loadstart'), 1, 'fired loadstart exactly once');
    equal(count(events, 'ended'), 1, 'fired ended exactly once');
    ok(player.ended(), 'the video is still ended');
    done();
  });
  player.play();
});
