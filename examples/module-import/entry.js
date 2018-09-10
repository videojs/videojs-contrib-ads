/*

This example shows how to include videojs-contrib-ads as a module import
in an ad plugin. It uses webpack to achieve this.

To build this example:

* follow instructions in the documentation to build videojs-contrib-ads
  * http://videojs.github.io/videojs-contrib-ads/developer/getting-started.html
* cd to this directory
* npm install webpack -g
* npm install webpack-command -g
* webpack ./entry.js --output=bundle.js

*/

import videojs from 'video.js';

// This import works because we're inside the contrib-ads project.
// You will want to import 'videojs-contrib-ads' in your code after
// installing via NPM.
import '../..';

videojs.plugin('examplePlugin', function() {
  this.ads();

  // Ad plugin logic goes here
});

var player = videojs('#player');

player.examplePlugin();

console.log('player.ads', player.ads);
