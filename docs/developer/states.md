<script src="./lib/railroad-diagrams.js"></script>
<link rel="stylesheet" href="./lib/railroad-diagrams.css"/>
<link rel="stylesheet" href=".states.css"/>

# States

videojs.contrib-ads moves through various states as a content video plays. Here's a state diagram which shows the states of the ads plugin and how it transitions between them:

![](ad-states.png)

Many methods in the public API are implemented by inspecting the current state. The current state instance should not be inspected directly by integrations.

States are implemented as classes with a 3-tiered inheritance hierarchy. All states are children of either `AdState` or `ContentState`. In turn, `AdState` and `ContentState` are children of `State`.

## BeforePreroll

The initial state. On source change, contrib-ads returns to this state for the new source. This state is not an ad state because content playback has not been blocked by the ad plugin yet.

<script>
Diagram(
  NonTerminal('init'),
  Optional(
    NonTerminal('onAdsReady')
  ),
  Choice(
    0,
    NonTerminal('onPlay'),
    NonTerminal('onNoPreroll'),
    NonTerminal('skipLinearAdMode'),
  )
)
.addTo(document.querySelector('#diagram-1'));
</script>
<div id="diagram-1"></div>

## Preroll

This state encapsulates checking for the presense of preroll ads, preparing for preroll ads, playing preroll ads, and restoring content after preroll ads. We move into this state when content playback is requested, resulting in a `play` event. At this point, playback is officially blocked by the ad plugin. We leave this state when content playback begins, resulting in a `playing` event.

## ContentPlayback

This state represents normal content playback, even if the player is paused.

## Midroll

This state encapsulates preparing for midroll ads, playing midroll ads, and restoring content after preroll ads. It begins when the integration invokes `startLinearAdMode` and it ends when content resumes, resulting in a `playing` event.

## Postroll

This state encapsulates checking for postroll ads and playing postroll ads. This state begins when content ends for the first time, resulting in a `contentended` event. This state leads to the AdsDone state; the ad plugin will not return to ContentPlayback for this source.

## AdsDone

No more ads will play. The user can seek and re-watch content as they please. The only way to leave this state is by changing the content source.
