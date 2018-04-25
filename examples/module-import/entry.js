/*

This example shows how to include videojs-contrib-ads as a module import
in an ad plugin. It uses webpack to achieve this.

To build this example:

* follow instructions in README to build videojs-contrib-ads
  * https://github.com/videojs/videojs-contrib-ads/#building
* cd to this directory
* npm install webpack -g
* webpack ./entry.js bundle.js

*/

import videojs from 'video.js';

// This import works because we're inside the contrib-ads project.
// You will want to import 'videojs-contrib-ads' in your code.
import '../..';

videojs.plugin('examplePlugin', function() {
  this.ads();

  // Ad plugin logic goes here
});

var player = videojs('#player');

player.examplePlugin();

console.log('player.ads', player.ads);