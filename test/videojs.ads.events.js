var video, player, events, filteredEvents, occurInOrder, count, attachListeners, contentUrl;

filteredEvents = {
  contenttimeupdate: 1,
  contentprogress: 1,
  contentwaiting: 1,
  contentsuspend: 1,
  adtimeupdate: 1,
  adprogress: 1,
  adwaiting: 1,
  adsuspend: 1,
  timeupdate: 1,
  progress: 1,
  waiting: 1,
  suspend: 1
};

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

attachListeners = function(player) {
  var Html5 = videojs.getComponent('Html5');
  // capture video element events during test runs
  player.on(Html5.Events.concat(Html5.Events.map(function(event) {
    return 'ad' + event;
  })).concat(Html5.Events.map(function(event) {
    return 'content' + event;
  })).concat([
    // events emitted by ad plugin
    'adtimeout',
    'contentended',
    'contentupdate',
    'contentplayback',
    // events emitted by third party ad implementors
    'adsready',
    'adscanceled',
    'adstart',  // startLinearAdMode()
    'adend'     // endLinearAdMode()

  ]), function(event) {
    events.push(event.type);
  });
  events = [];
  return player;
};

// get the absolute URL to the video so that snapshot restores aren't
// seen as content updates
contentUrl = (function() {
  var a = document.createElement('a');
  a.href = '../example/sintel-low.mp4';
  return a.href;
})();

module('Ad Events Tranformation', {
  setup: function() {
    var vjsOptions = {
      inactivityTimeout: 0
    };

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

    if (QUnit.config.flash) {
      vjsOptions.techOrder = ['flash'];
    }

    player = videojs(video, vjsOptions);

    // load a video
    player.src({
      src: contentUrl,
      type: 'video/mp4'
    });
  },
  teardown: function(){
    player.dispose();
  }
});

test('linear ads should not affect regular video playback events', function(assert) {
  var done = assert.async();
  player.exampleAds({
    midrollPoint: 2
  });
  attachListeners(player).on('ended', function() {
    events = events.filter(function(event) {
      return !(event in filteredEvents);
    });

    ok(events.length > 0, 'fired video events');

    // ad events should occur in a sensible order
    occurInOrder(events, [
      'adstart', 'adend',                 // play a preroll
      'contentplayback',
      'adstart', 'adend',                 // play a midroll
      'contentplayback',
      'adstart', 'contentended', 'adend', // play a postroll
      'contentplayback',
      'ended'                             // end the video
    ]);

    // content related events should occur in a sensible order
    occurInOrder(events, [
      'play',    // start the video
      'playing', // content begins playing
      'ended'    // end the video
    ]);
    occurInOrder(events, [
      'loadstart',
      'playing'
    ]);

    equal(count(events, 'adsready'), 1, 'fired adsready exactly once');
    equal(count(events, 'loadstart'), 1, 'fired loadstart exactly once');
    equal(count(events, 'ended'), 1, 'fired ended exactly once');
    ok(player.ended(), 'the video is still ended');
    done();
  });
  player.ready(function() {
    player.play();
  });
});

test('regular video playback is not affected', function(assert) {
  var done = assert.async();

  // disable ads
  player.exampleAds({
    adServerUrl: 'empty-inventory.json'
  });

  attachListeners(player).on('ended', function() {
    events = events.filter(function(event) {
      return !(event in filteredEvents);
    });

    ok(events.length > 0, 'fired video events');
    occurInOrder(events, [
      'play', // start the video
      'ended' // end the video
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
  player.ready(function() {
    player.play();
  });
});
