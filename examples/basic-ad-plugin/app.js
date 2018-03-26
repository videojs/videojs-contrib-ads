(function() {
  'use strict';
  var pad = function(n, x, c) {
    return (new Array(n).join(c || '0') + x).slice(-n);
  };
  var padRight = function(n, x, c) {
    return (x + (new Array(n).join(c || '0'))).slice(0, n);
  };

  var player = videojs('examplePlayer');

  // initalize example ads integration for this player
  player.exampleAds({
    debug: true
  });

  var log = document.querySelector('.log');
  var Html5 = videojs.getTech('Html5');
  Html5.Events.concat(Html5.Events.map(function(evt) {
    return 'ad' + evt;
  })).concat(Html5.Events.map(function(evt) {
    return 'content' + evt;
  })).concat([
    // events emitted by ad plugin
    'adtimeout',
    'contentupdate',
    'contentplayback',
    // events emitted by third party ad implementors
    'adsready',
    'adscanceled',
    'adplaying',
    'adstart',  // startLinearAdMode()
    'adend'     // endLinearAdMode()

  ]).filter(function(evt) {
    var events = {
      progress: 1,
      timeupdate: 1,
      suspend: 1,
      emptied: 1,
      contentprogress: 1,
      contenttimeupdate: 1,
      contentsuspend: 1,
      contentemptied: 1,
      adprogress: 1,
      adtimeupdate: 1,
      adsuspend: 1,
      ademptied: 1
    }
    return !(evt in events);

  }).map(function(evt) {
    player.ready(function() {
      player.on(evt, function(event) {
        var d , str, li;

        li = document.createElement('li');

        d = new Date();
        d = '' +
          pad(2, d.getHours()) + ':' +
          pad(2, d.getMinutes()) + ':' +
          pad(2, d.getSeconds()) + '.' +
          pad(3, d.getMilliseconds());

        if (event.type.indexOf('ad') === 0) {
          li.className = 'ad-event';
        } else if (event.type.indexOf('content') === 0) {
          li.className = 'content-event';
        }

        str = evt;

        if (evt === 'contentupdate') {
          str += ' ' + event.oldValue + " -> " + event.newValue;
          li.className = 'content-adplugin-event';
        }
        if (evt === 'contentchanged') {
          li.className = 'content-adplugin-event';
        }
        if (evt === 'contentplayback') {
          li.className = 'content-adplugin-event';
        }
        if (evt === 'adplay') {
          player.trigger('ads-ad-started');
        }

        li.innerHTML = str;
        log.insertBefore(li, log.firstChild);
      });
    });
  });

  document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    player.src(document.querySelector('input[type="url"]').value);
  });
})();
