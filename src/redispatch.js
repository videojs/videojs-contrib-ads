/*
The goal of this feature is to make player events work as an integrator would
expect despite the presense of ads. For example, an integrator would expect
an `ended` event to happen once the content is ended. If an `ended` event is sent
as a result of an ad ending, that is a bug. The `redispatch` method should recognize
such `ended` events and prefix them so they are sent as `adended`, and so on with
all other player events.
*/

// Stop propogation for an event
const cancelEvent = (player, event) => {
  // Pretend we called stopImmediatePropagation because we want the native
  // element events to continue propagating
  event.isImmediatePropagationStopped = function() {
    return true;
  };
  event.cancelBubble = true;
  event.isPropagationStopped = function() {
    return true;
  };
};

// Stop propogation for an event, then send a new event with the type of the original
// event with the given prefix added.
const prefixEvent = (player, prefix, event) => {
  cancelEvent(player, event);
  player.trigger({
    type: prefix + event.type,
    state: player.ads.state,
    originalEvent: event
  });
};

// Handle a player event, either by redispatching it with a prefix, or by
// letting it go on its way without any meddling.
export default function redispatch(event) {

  // Playing event
  // Requirements:
  // * Normal playing event when there is no preroll
  // * No playing event before preroll
  // * At least one playing event after preroll
  if (event.type === 'playing') {
    if (this.ads.isInAdMode()) {

      if (this.ads.isContentResuming()) {

        // Prefix playing event when resuming after postroll.
        if (this.ads._postrollMode) {
          prefixEvent(this, 'content', event);
        }

      // If content video element is used for ads, adplaying was already sent by
      // cancelContentPlay. Avoid sending another.
      } else if (this.ads.videoElementRecycled()) {
        cancelEvent(this, event);

      // Prefix playing events due to ads.
      } else {
        prefixEvent(this, 'ad', event);
      }
    }

  // Ended event
  // Requirements:
  // * A single ended event when there is no postroll
  // * No ended event before postroll
  // * A single ended event after postroll
  } else if (event.type === 'ended') {

    if (this.ads.isInAdMode()) {
      if (this.ads.isContentResuming()) {

        // The final and true ended event
        if (this.ads._contentHasEnded) {
          return;
        }

        // Prefix ended during content resuming
        prefixEvent(this, 'content', event);

      } else {

        // Prefix ended due to ad ending.
        prefixEvent(this, 'ad', event);
      }
    } else {

      // Prefix ended due to content ending.
      prefixEvent(this, 'content', event);
    }

  // Loadstart event
  // Requirements:
  // * Loadstart due to snapshot restore is prefixed
  // * Loadstart due to ad is prefixed
  // * Loadstart due to content source change is not prefixed
  } else if (event.type === 'loadstart') {

    if (this.ads.isInAdMode()) {
      if (this.ads.isContentResuming()) {

        // Loadstart due to content source change
        if (this.currentSrc() !== this.ads.contentSrc) {
          return;
        }

        // Loadstart due to snapshot restore
        prefixEvent(this, 'content', event);

      } else {

        // Loadstart for ad
        prefixEvent(this, 'ad', event);

      }

    }

  // Play event
  // Requirements:
  // * Play events are never prefixed
  } else if (event.type === 'play') {
    return;

  // Standard handling for all other events
  } else if (this.ads.isInAdMode()) {
    if (this.ads.isContentResuming()) {
      prefixEvent(this, 'content', event);
    } else {
      prefixEvent(this, 'ad', event);
    }
  }

}
