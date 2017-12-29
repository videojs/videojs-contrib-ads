/*

This example shows how to include videojs-contrib-ads as a module import
in an ad integration. It uses webpack to achieve this.

To build this example:

* follow instructions in README to build videojs-contrib-ads
  * https://github.com/videojs/videojs-contrib-ads/#building
* cd to this directory
* npm install webpack -g
* webpack ./entry.js bundle.js

*/

import videojs from 'video.js';
import ads from '../../dist/videojs.ads.min.js';

videojs.plugin('examplePlugin', function() {
  this.ads();

  // Ad integration logic goes here
});

var player = videojs('#player');

player.examplePlugin();

console.log('player.ads', player.ads);