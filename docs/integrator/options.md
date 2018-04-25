## Plugin Options

videojs-contrib-ads can be configured with custom settings by providing a settings object at initialization:

```js
player.ads({
  timeout: 3000
});
```

The current set of options are described in detail below.

### timeout

Type: `number`
Default Value: 5000

The maximum amount of time to wait in ad mode before an ad break begins. If this time elapses, ad mode ends and content resumes.

Some ad plugins may want to play a preroll ad even after the timeout has expired and content has begun playing. To facilitate this, videojs-contrib-ads will respond to an `adsready` event during content playback with a `readyforpreroll` event. If you want to avoid this behavior, make sure your plugin does not send `adsready` after `adtimeout`.

### prerollTimeout

Type: `number`
No Default Value

Override the `timeout` setting just for preroll ads (the time between `play` and `startLinearAdMode`)

### postrollTimeout

Type: `number`
No Default Value

Override the `timeout` setting just for preroll ads (the time between `readyforpostroll` and `startLinearAdMode`)

### stitchedAds

Type: `boolean`
Default Value: `false`

Set this to true if you are using ads stitched into the content video. This is necessary for ad events to be sent correctly.

### debug

Type: `boolean`
Default Value: false

If debug is set to true, the ads plugin will output additional debugging information.
This can be handy for diagnosing issues or unexpected behavior in an ad plugin.
