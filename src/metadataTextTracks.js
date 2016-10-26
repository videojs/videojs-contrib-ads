/**
* This feature allows metadata text tracks to be manipulated once available, @see process.
* It also allows ad implementations to leverage ad cues coming through
* text tracks, @see processAdTrack
**/

import videojs from 'video.js';

const metadataTextTracks = {};

/**
* This feature allows metadata text tracks to be manipulated once they are available,
* usually after the 'loadstart' event is observed on the player
* @param player A reference to a player
* @param processTrack A method that performs some operations on a metadata text track
**/
metadataTextTracks.process = function(player, processTrack) {
  const tracks = player.textTracks();
  const prepareTrack = function(track) {
    if (track.kind === 'metadata') {
      metadataTextTracks.setTrackMode(track);
      processTrack(player, track);
    }
  };

  // Text tracks are available
  if (tracks.length > 0) {
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      prepareTrack(track);
    }
  // Wait until text tracks are added
  } else {
    tracks.addEventListener('addtrack', (event) => {
      const track = event.track;
      prepareTrack(track);
    });
  }
};

/**
* Sets the track mode to one of 'disabled', 'hidden' or 'showing'
* @see https://github.com/videojs/video.js/blob/master/docs/guides/text-tracks.md
* Default behavior is to do nothing, @override if this is not desired
* @param track The text track to set the mode on
*/
metadataTextTracks.setTrackMode = function(track) {
  return;
};

/**
* Determines whether cue is an ad cue and returns the cue data.
* @param player A reference to the player
* @param cue The cue to be checked
* Returns the given cue by default @override if futher processing is required
* @return the cueData in JSON if cue is a supported ad cue, or -1 if not
**/
metadataTextTracks.getSupportedAdCue = function(player, cue) {
  return cue;
};

/**
* Gets the id associated with a cue.
* @param cue The cue to extract an ID from
* @returns The first occurance of 'id' in the object @override if this is not the desired cue id
**/
metadataTextTracks.getCueId = function(cue) {
  return cue.id;
};

/**
* This feature allows ad metadata tracks to be manipulated in ad implementations
* @param player A reference to the player
* @param cues The set of cues to work with
* @param processCue A method that uses a cue to make some ad request in the ad implementation
* @param [cancelAds] A method that dynamically cancels ads in the ad implementation
**/
metadataTextTracks.processAdTrack = function(player, cues, processCue, cancelAds) {
  player.ads.includedCues = {};

  // loop over set of cues
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    let cueData, cueId, startTime;

    // Exit if this is not a supported cue
    cueData = this.getSupportedAdCue(player, cue);
    if (cueData === -1) {
      videojs.log.warn('Skipping as this is not a supported ad cue.', cue);
      return;

    // Continue processing supported cue
    } else {
      cueId = this.getCueId(player, cue);
      startTime = Math.floor(cue.startTime);

      // Skip ad if cue was already used
      if (cueIncluded(player, cueId)) {
        videojs.log('Skipping already included ad with ID ' + cueId);
        return;
      }

      // Process cue as an ad cue
      processCue(player, cueData, cueId, startTime);

      // Indicate that this cue has been used
      setCueIncluded(player, cueId);
    }

    // Optional dynamic ad cancellation
    if (cancelAds !== undefined) {
      cancelAds(player, cueData);
    }
  }
};

/**
* Checks whether a cue has already been used
* @param cueId The Id associated with a cue
**/
const cueIncluded = function(player, cueId) {
  return (cueId !== undefined) && player.ads.includedCues[cueId];
};

/**
* Indicates that a cue has been used
* @param cueId The Id associated with a cue
**/
const setCueIncluded = function(player, cueId) {
  if (cueId !== undefined && cueId !== '') {
    player.ads.includedCues[cueId] = true;
  }
};

module.exports = metadataTextTracks;

