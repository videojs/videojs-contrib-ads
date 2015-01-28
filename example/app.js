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
    videojs.Html5.Events.concat([
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
        emptied: 1
      }
      return !(evt in events);

    }).map(function(evt) {
      player.on(evt, function(event) {
        var d , str, pre;

        pre = document.createElement('pre');
        if (/^(ad|content)/.test(evt)) {
          pre.className = 'highlight';
        }

        d = new Date();
        d = '' +
          pad(2, d.getHours()) + ':' +
          pad(2, d.getMinutes()) + ':' +
          pad(2, d.getSeconds()) + '.' +
          pad(3, d.getMilliseconds());

        str = '[' + (d) + '] ' + evt + '\n';

        if (evt === 'contentupdate') {
          str += "\toldValue: " + event.oldValue + "\n" +
                 "\tnewValue: " + event.newValue + "\n";
        }
        pre.textContent = str;
        log.insertBefore(pre, log.firstChild);
      });
    });
  });

  document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    player.src(document.querySelector('input[type="url"]').value);
  });
})();
