# videojs-contrib-ads

A framework that provides common functionality needed by video advertisement libraries working with video.js.

## Installation

```sh
npm install --save videojs-contrib-ads
```

The npm installation is preferred, but Bower works, too.

```sh
bower install  --save videojs-contrib-ads
```

## Usage

To include videojs-contrib-ads on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-contrib-ads.min.js"></script>
<script>
  var player = videojs('my-video');

  player.contribAds();
</script>
```

### Browserify

When using with Browserify, install videojs-contrib-ads via npm and `require` the plugin as you would any other module.

```js
var videojs = require('video.js');

// The actual plugin function is exported by this module, but it is also
// attached to the `Player.prototype`; so, there is no need to assign it
// to a variable.
require('videojs-contrib-ads');

var player = videojs('my-video');

player.contribAds();
```

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the plugin as you normally would:

```js
require(['video.js', 'videojs-contrib-ads'], function(videojs) {
  var player = videojs('my-video');

  player.contribAds();
});
```

## License

Apache-2.0. Copyright (c) [object Object]


[videojs]: http://videojs.com/
