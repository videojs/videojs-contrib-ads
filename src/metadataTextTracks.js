import videojs from 'video.js';

const metadataTextTracks = {};
let includedCues = {};

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
      // Make sure track is 'hidden' rather than 'disabled' as it may have already
      // existed and had been 'disabled' during a playlist change
      track.mode = 'hidden';
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
* @override only if necessary
* Determines whether cue is an ad cue and returns the cue data.
* @param player A reference to the player
* @param cue The cue to be checked
* Returns the given cue by default
* @return the cueData in JSON if cue is a supported ad cue, or -1 if not
**/
metadataTextTracks.getSupportedAdCue = function(player, cue) {
  return cue;
};

/**
* @override only if necessary
* Gets the id associated with a cue.
* @param cue The cue to extract an ID from
* @returns The first occurance of 'id' in the object
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
  // loop over set of cues
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    let cueData, cueId, startTime;

    // Exit if this is not a supported cue
    cueData = this.getSupportedAdCue(player, cue);
    if (cueData === -1) {
      videojs.log.debug('Skipping as this is not a supported ad cue.', cue);
      return;

    // Continue processing supported cue
    } else {
      cueId = this.getCueId(player, cue);
      startTime = Math.floor(cue.startTime);

      // Skip ad if cue was already used
      if (cueIncluded(cueId)) {
        videojs.log('Skipping already included ad with ID ' + cueId);
        return;
      }

      // Process cue as an ad cue
      processCue(player, cueData, cueId, startTime);

      // Indicate that this cue has been used
      setCueIncluded(cueId);
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
const cueIncluded = function(cueId) {
  return (cueId !== undefined) && includedCues[cueId];
};

/**
* Indicates that a cue has been used
* @param cueId The Id associated with a cue
**/
const setCueIncluded = function(cueId) {
  if (cueId !== undefined && cueId !== '') {
    includedCues[cueId] = true;
  }
};

module.exports = metadataTextTracks;

