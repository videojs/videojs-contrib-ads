(function(){

/**
 * Events which are explicitly ignored by player listeners in tests.
 *
 * @type {Array}
 */
var filteredEvents = [
  'contenttimeupdate',
  'contentprogress',
  'contentwaiting',
  'contentsuspend',
  'adtimeupdate',
  'adprogress',
  'adwaiting',
  'adsuspend',
  'timeupdate',
  'progress',
  'waiting',
  'suspend'
];

/**
 * All player events that are listened to in the testing process.
 *
 * @type {Array}
 */
var relevantEvents = (function (events) {
  return _.union(
    events,
    events.map(function(event) {
      return 'ad' + event;
    }),
    events.map(function(event) {
      return 'content' + event;
    }),
    [

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

    ]).filter(function(event) {
      return filteredEvents.indexOf(event) === -1;
    });
}(videojs.getComponent('Html5').Events));

/**
 * Attaches a listener to track occurrences of `relevantEvents` on a player
 * in a testing context.
 *
 * @param  {Object} env
 *         A QUnit testing context. Expects `player` and `events` properties.
 * @return {Object}
 *         The `player` object in `env`.
 */
var attachPlayerListeners = function(env) {
  return env.player.on(relevantEvents, function(event) {
    env.events.push(event.type);
  });
};

/**
 * Asserts that elements in the first array occur in the same order as
 * in the second array. It's okay to have duplicates or intermediate
 * elements in the first array that don't occur in the second. An
 * assertion will fail if all of the elements in the second array are
 * not present in the first.
 *
 * @param  {Object} assert
 * @param  {Array} actual
 * @param  {Array} expected
 */
var occurInOrder = function(assert, actual, expected) {
  var i, j;

  for (i = j = 0; i < actual.length; i++) {
    if (actual[i] !== expected[j]) {
      continue;
    }

    assert.strictEqual(
      actual[i],
      expected[j],
      'matched "' + expected[j] + '" to event number ' + i
    );

    j++;
  }

  assert.strictEqual(
    j,
    expected.length,
    expected.length !== j ? 'missing ' + expected.slice(j).join(', ') : 'all expected events occurred'
  );
};

/**
 * Counts the number of elements in an array that are strictly equal to the
 * specified element.
 *
 * @param  {Array} array
 * @param  {Mixed} element
 * @return {Number}
 */
var count = function(array, element) {
  var i = array.length, result = 0;

  while (i--) {
    if (array[i] === element) {
      result++;
    }
  }

  return result;
};

QUnit.module('Ad Events Tranformation', {

  beforeEach: function() {
    var vjsOptions = {
      inactivityTimeout: 0
    };

    var video = document.createElement('video');

    this.events = [];

    video.className = 'video-js vjs-default-skin';
    video.width = '640';
    video.height = '272';
    video.setAttribute('controls', '');

    // add video element behavior to phantom's non-functioning version
    if (/phantom/i.test(window.navigator.userAgent)) {
      video.removeAttribute = function(attr) {
        this[attr] = '';
      };

      video.load = function() {};
      video.play = function() {};
    }

    document.getElementById('qunit-fixture').appendChild(video);

    if (QUnit.config.flash) {
      vjsOptions.techOrder = ['flash'];
    }

    this.player = videojs(video, vjsOptions);

    // load a video
    this.player.src({

      // get the absolute URL to the video so that snapshot restores aren't
      // seen as content updates
      src: (function() {
        var a = document.createElement('a');
        a.href = '../example/sintel-low.mp4';
        return a.href;
      })(),
      type: 'video/mp4'
    });
  },

  afterEach: function(){
    this.player.dispose();
  }
});

QUnit.test('linear ads should not affect regular video playback events', function(assert) {
  var done = assert.async();

  this.player.exampleAds({
    midrollPoint: 2
  });

  attachPlayerListeners(this).on('ended', videojs.bind(this, function() {
    assert.ok(this.events.length > 0, 'fired video events');

    // ad events should occur in a sensible order
    occurInOrder(assert, this.events, [
      'adstart', 'adend',                 // play a preroll
      'contentplayback',
      'adstart', 'adend',                 // play a midroll
      'contentplayback',
      'adstart', 'contentended', 'adend', // play a postroll
      'contentplayback',
      'ended'                             // end the video
    ]);

    // content related events should occur in a sensible order
    occurInOrder(assert, this.events, [
      'play',    // start the video
      'playing', // content begins playing
      'ended'    // end the video
    ]);

    occurInOrder(assert, this.events, [
      'loadstart',
      'playing'
    ]);

    assert.strictEqual(count(this.events, 'adsready'), 1, 'fired adsready exactly once');
    assert.strictEqual(count(this.events, 'loadstart'), 1, 'fired loadstart exactly once');
    assert.strictEqual(count(this.events, 'ended'), 1, 'fired ended exactly once');
    assert.ok(this.player.ended(), 'the video is still ended');
    done();
  }));

  this.player.ready(this.player.play);
});

QUnit.test('regular video playback is not affected', function(assert) {
  var done = assert.async();

  // disable ads
  this.player.exampleAds({
    adServerUrl: 'empty-inventory.json'
  });

  attachPlayerListeners(this).on('ended', videojs.bind(this, function() {
    assert.ok(this.events.length > 0, 'fired video events');

    occurInOrder(assert, this.events, [
      'play', // start the video
      'ended' // end the video
    ]);

    occurInOrder(assert, this.events, [
      'loadstart',
      'playing'
    ]);

    assert.strictEqual(count(this.events, 'adstart'), 0, 'did not fire adstart');
    assert.strictEqual(count(this.events, 'adend'), 0, 'did not fire adend');
    assert.strictEqual(count(this.events, 'loadstart'), 1, 'fired loadstart exactly once');
    assert.strictEqual(count(this.events, 'ended'), 1, 'fired ended exactly once');
    assert.ok(this.player.ended(), 'the video is still ended');
    done();
  }));

  this.player.ready(this.player.play);
});

}());
