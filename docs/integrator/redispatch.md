# Redispatch

This project includes a feature called `redispatch` which will monitor all [media
events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) and
modify them with the goal of making the usage of ads transparent. For example, when an
ad is playing, a `playing` event would be sent as an `adplaying` event. Code that
listens to the `playing` event will not see `playing` events that result from an
advertisement playing.

In order for redispatch to work correctly, any ad plugin built using contrib-ads must be
initialized as soon as possible, before any other plugins that attach event listeners.

Different platforms, browsers, devices, etc. send different media events at different
times. Redispatch does not guarentee a specific sequence of events, but instead ensures
that certain expectations are met. The next section describes those expectations.

## The Law of the Land: Redispatch Event Behavior

### `play` events

* Play events represent intention to play, such as clicking the play button.
* Play events do not occur during [ad playback](#isadplaying).
* Play events can happen during [ad mode](#isinadmode) when [an ad is not currently
 playing](#isadplaying), but content will not play as a result.

### `playing` events

* Playing events may occur when content plays.
* If there is a preroll, there is no playing event before the preroll.
* If there is a preroll, there is at least one playing event after the preroll.

### `ended` events

* If there is no postroll, there is a single ended event when content ends.
* If there is a postroll, there is no ended event before the postroll.
* If there is a postroll, there is a single ended event after the postroll.

### `loadstart` events

* There is always a loadstart event after content starts loading.
* There is always a loadstart when the source changes.
* There is never a loadstart due to an ad loading.

### Other events

* As a general rule, usual events are not sent if the plugin is in
 [ad mode](#isinadmode).
