(function() {
  'use strict';
  var pad = function(n, x) {
    return (new Array(n).join('0') + x).slice(-n);
  };

  var player = videojs('examplePlayer', {}, function(){
    // initalize example ads integration for this player
    var player = this;
    player.exampleAds({
      debug: true
    });

    var log = document.querySelector('.log');
    videojs.Html5.Events.concat(videojs.Html5.Events.map(function(evt) {
      return 'ad' + evt;
    })).concat(videojs.Html5.Events.map(function(evt) {
      return 'content' + evt;
    })).concat([
      // events emitted by ad plugin
      'adtimeout',
      'contentupdate',
      'contentended',
      // events emitted by third party ad implementors
      'adsready',
      'adscanceled',
      'adstart',  // startLinearAdMode()
      'adend'     // endLinearAdMode()

    ]).filter(function(evt) {
      var events = {
        progress: 1,
        timeupdate: 1,
        suspend: 1,
        emptied: 1,
        adprogress: 1,
        adtimeupdate: 1,
        adsuspend: 1,
        ademptied: 1
      }
      return !(evt in events);

    }).map(function(evt) {
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

        str = '[' + (d) + '] ' + evt;

        if (evt === 'contentupdate') {
          str += "\toldValue: " + event.oldValue + "\n" +
                 "\tnewValue: " + event.newValue + "\n";
        }
        li.textContent = str;
        log.insertBefore(li, log.firstChild);
      });
    });
  });

  document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    player.src(document.querySelector('input[type="url"]').value);
  });
})();
