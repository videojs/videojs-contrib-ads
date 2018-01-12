/*
This feature sends a `contentupdate` event when the player source changes.
*/

// Start sending contentupdate events
export default function initializeContentupdate(player) {

  // Keep track of the current content source
  // If you want to change the src of the video without triggering
  // the ad workflow to restart, you can update this variable before
  // modifying the player's source
  player.ads.contentSrc = player.currentSrc();

  // Check if a new src has been set, if so, trigger contentupdate
  const checkSrc = function() {
    if (!player.ads._inLinearAdMode) {
      const src = player.currentSrc();

      if (src !== player.ads.contentSrc) {
        player.trigger({
          type: 'contentupdate',
          oldValue: player.ads.contentSrc,
          newValue: src
        });
        player.ads.contentSrc = src;
      }
    }
  };

  // loadstart reliably indicates a new src has been set
  player.on('loadstart', checkSrc);
  // check immediately in case we missed the loadstart
  player.setTimeout(checkSrc, 1);
}
