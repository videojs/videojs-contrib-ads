/*
This main plugin file is responsible for integration logic and enabling the features
that live in in separate files.
*/

import videojs from 'video.js';

import redispatch from './redispatch.js';
import * as snapshot from './snapshot.js';
import initializeContentupdate from './contentupdate.js';
import adMacroReplacement from './macros.js';
import cueTextTracks from './cueTextTracks.js';

import {BeforePreroll} from './States/RenameMe.js';

const VIDEO_EVENTS = videojs.getTech('Html5').Events;

// ---------------------------------------------------------------------------
// Ad Framework
// ---------------------------------------------------------------------------

// default framework settings
const defaults = {
  // maximum amount of time in ms to wait to receive `adsready` from the ad
  // implementation after play has been requested. Ad implementations are
  // expected to load any dynamic libraries and make any requests to determine
  // ad policies for a video during this time.
  timeout: 5000,

  // maximum amount of time in ms to wait for the ad implementation to start
  // linear ad mode after `readyforpreroll` has fired. This is in addition to
  // the standard timeout.
  prerollTimeout: 100,

  // maximum amount of time in ms to wait for the ad implementation to start
  // linear ad mode after `contentended` has fired.
  postrollTimeout: 100,

  // when truthy, instructs the plugin to output additional information about
  // plugin state to the video.js log. On most devices, the video.js log is
  // the same as the developer console.
  debug: false,

  // set this to true when using ads that are part of the content video
  stitchedAds: false
};

const contribAdsPlugin = function(options) {

  const player = this; // eslint-disable-line consistent-this

  const settings = videojs.mergeOptions(defaults, options);

  // prefix all video element events during ad playback
  // if the video element emits ad-related events directly,
  // plugins that aren't ad-aware will break. prefixing allows
  // plugins that wish to handle ad events to do so while
  // avoiding the complexity for common usage
  const videoEvents = VIDEO_EVENTS.concat([
    'firstplay',
    'loadedalldata',
    'playing'
  ]);

  // Set up redispatching of player events
  player.on(videoEvents, redispatch);

  // If we haven't seen a loadstart after 5 seconds, the plugin was not initialized
  // correctly.
  player.setTimeout(() => {
    if (!player.ads._hasThereBeenALoadStartDuringPlayerLife && player.src() !== '') {
      videojs.log.error('videojs-contrib-ads has not seen a loadstart event 5 seconds ' +
        'after being initialized, but a source is present. This indicates that ' +
        'videojs-contrib-ads was initialized too late. It must be initialized ' +
        'immediately after video.js in the same tick. As a result, some ads will not ' +
        'play and some media events will be incorrect. For more information, see ' +
        'https://github.com/videojs/videojs-contrib-ads#important-note-about-initialization');
    }
  }, 5000);

  // "vjs-has-started" should be present at the end of a video. This makes sure it's
  // always there.
  player.on('ended', function() {
    if (!player.hasClass('vjs-has-started')) {
      player.addClass('vjs-has-started');
    }
  });

  // We now auto-play when an ad gets loaded if we're playing ads in the same video
  // element as the content.
  // The problem is that in IE11, we cannot play in addurationchange but in iOS8, we
  // cannot play from adcanplay.
  // This will prevent ad-integrations from needing to do this themselves.
  player.on(['addurationchange', 'adcanplay'], function() {
    if (player.ads.snapshot && player.currentSrc() === player.ads.snapshot.currentSrc) {
      return;
    }

    // If an ad isn't playing, don't try to play an ad. This could result from prefixed
    // events when the player is blocked by a preroll check, but there is no preroll.
    if (!player.ads.isAdPlaying()) {
      return;
    }

    player.play();
  });

  player.on('nopreroll', function() {
    player.ads.nopreroll_ = true;
  });

  player.on('nopostroll', function() {
    player.ads.nopostroll_ = true;
  });

  // Remove ad-loading class when ad plays or when content plays (in case there was no ad)
  // If you remove this class too soon you can get a flash of content!
  player.on(['ads-ad-started', 'playing'], () => {
    player.removeClass('vjs-ad-loading');
  });

  // Restart the cancelContentPlay process.
  player.on('playing', () => {
    player.ads._cancelledPlay = false;
  });

  player.one('loadstart', () => {
    player.ads._hasThereBeenALoadStartDuringPlayerLife = true;
  });

  player.on('loadeddata', () => {
    player.ads._hasThereBeenALoadedData = true;
  });

  player.on('loadedmetadata', () => {
    player.ads._hasThereBeenALoadedMetaData = true;
  });

  // Replace the plugin constructor with the ad namespace
  player.ads = {
    settings,
    state: 'content-set',
    disableNextSnapshotRestore: false,

    // This is true if we have finished actual content playback but haven't
    // dealt with postrolls and officially ended yet
    _contentEnding: false,

    // This is set to true if the content has officially ended at least once.
    // After that, the user can seek backwards and replay content, but _contentHasEnded
    // remains true.
    _contentHasEnded: false,

    // Tracks if loadstart has happened yet for the initial source. It is not reset
    // on source changes because loadstart is the event that signals to the ad plugin
    // that the source has changed. Therefore, no special signaling is needed to know
    // that there has been one for subsequent sources.
    _hasThereBeenALoadStartDuringPlayerLife: false,

    // Tracks if loadeddata has happened yet for the current source.
    _hasThereBeenALoadedData: false,

    // Tracks if loadedmetadata has happened yet for the current source.
    _hasThereBeenALoadedMetaData: false,

    // Are we after startLinearAdMode and before endLinearAdMode?
    _inLinearAdMode: false,

    // This is an estimation of the current ad type being played
    // This is experimental currently. Do not rely on its presence or behavior!
    adType: null,

    VERSION: '__VERSION__',

    // TODO reset state to content-set here instead of in every contentupdate case
    reset() {
      player.ads.disableNextSnapshotRestore = false;
      player.ads._contentEnding = false;
      player.ads._contentHasEnded = false;
      player.ads.snapshot = null;
      player.ads.adType = null;
      player.ads._hasThereBeenALoadedData = false;
      player.ads._hasThereBeenALoadedMetaData = false;
      player.ads._cancelledPlay = false;
    },

    // Call this when an ad response has been received and there are
    // linear ads ready to be played.
    startLinearAdMode() {

      player.ads.stateInstance.startLinearAdMode();

    },

    // Call this when a linear ad pod has finished playing.
    endLinearAdMode() {
      player.ads.stateInstance.endLinearAdMode();
    },

    // Call this when an ad response has been received but there are no
    // linear ads to be played (i.e. no ads available, or overlays).
    // This has no effect if we are already playing an ad.  Always
    // use endLinearAdMode() to exit from linear ad-playback state.
    skipLinearAdMode() {

      player.ads.stateInstance.skipLinearAdMode();

      // This event is no longer used by contrib-ads. It is only here for
      // compatibility with old integrations that may expect it.
      if (player.ads.state !== 'ad-playback') {
        player.trigger('adskip');
      }
    },

    stitchedAds(arg) {
      if (arg !== undefined) {
        this._stitchedAds = !!arg;
      }
      return this._stitchedAds;
    },

    // Returns whether the video element has been modified since the
    // snapshot was taken.
    // We test both src and currentSrc because changing the src attribute to a URL that
    // AdBlocker is intercepting doesn't update currentSrc.
    videoElementRecycled() {
      if (player.ads.shouldPlayContentBehindAd(player)) {
        return false;
      }

      if (!this.snapshot) {
        throw new Error(
          'You cannot use videoElementRecycled while there is no snapshot.');
      }

      const srcChanged = player.tech_.src() !== this.snapshot.src;
      const currentSrcChanged = player.currentSrc() !== this.snapshot.currentSrc;

      return srcChanged || currentSrcChanged;
    },

    // Returns a boolean indicating if given player is in live mode.
    // Can be replaced when this is fixed: https://github.com/videojs/video.js/issues/3262
    isLive(somePlayer) {
      if (somePlayer.duration() === Infinity) {
        return true;
      } else if (videojs.browser.IOS_VERSION === '8' && somePlayer.duration() === 0) {
        return true;
      }
      return false;
    },

    // Return true if content playback should mute and continue during ad breaks.
    // This is only done during live streams on platforms where it's supported.
    // This improves speed and accuracy when returning from an ad break.
    shouldPlayContentBehindAd(somePlayer) {
      return !videojs.browser.IS_IOS &&
             !videojs.browser.IS_ANDROID &&
             somePlayer.duration() === Infinity;
    },

    // Returns true if player is in ad mode.
    //
    // Ad mode definition:
    // If content playback is blocked by the ad plugin.
    //
    // Examples of ad mode:
    //
    // * Waiting to find out if an ad is going to play while content would normally be
    //   playing.
    // * Waiting for an ad to start playing while content would normally be playing.
    // * An ad is playing (even if content is also playing)
    // * An ad has completed and content is about to resume, but content has not resumed
    //   yet.
    //
    // Examples of not ad mode:
    //
    // * Content playback has not been requested
    // * Content playback is paused
    // * An asynchronous ad request is ongoing while content is playing
    // * A non-linear ad is active
    isInAdMode() {

      // Saw "play" but not "adsready"
      return player.ads.state === 'ads-ready?' ||

             // Waiting to learn about preroll
             player.ads.state === 'preroll?' ||

             // A linear ad is active
             player.ads.state === 'ad-playback' ||

             // Content is not playing again yet
             player.ads.state === 'content-resuming';
    },

    // Returns true if content is resuming after an ad. This is part of ad mode.
    isContentResuming() {
      return player.ads.state === 'content-resuming';
    },

    // Returns true if a linear ad is playing. This is part of ad mode.
    // This relies on startLinearAdMode and endLinearAdMode because that is the
    // most authoritative way of determinining if an ad is playing.
    isAdPlaying() {
      return this._inLinearAdMode;
    },

    /*
     * Remove the poster attribute from the video element tech, if present. When
     * reusing a video element for multiple videos, the poster image will briefly
     * reappear while the new source loads. Removing the attribute ahead of time
     * prevents the poster from showing up between videos.
     *
     * @param {Object} player The videojs player object
     */
    removeNativePoster() {
      const tech = player.$('.vjs-tech');

      if (tech) {
        tech.removeAttribute('poster');
      }
    }

  };

  player.ads.stateInstance = new BeforePreroll(player);

  player.ads.stitchedAds(settings.stitchedAds);

  player.ads.cueTextTracks = cueTextTracks;
  player.ads.adMacroReplacement = adMacroReplacement.bind(player);

  // Start sending contentupdate events for this player
  initializeContentupdate(player);

  // Global contentupdate handler for resetting plugin state
  player.on('contentupdate', player.ads.reset);

  // Ad Playback State Machine
  const states = {
    'content-set': {
      events: {
        adscanceled() {
          this.state = 'content-playback';
        },
        adsready() {
          this.state = 'ads-ready';
        },
        play() {
          this.state = 'ads-ready?';
        },
        adserror() {
          this.state = 'content-playback';
        },
        adskip() {
          this.state = 'content-playback';
        }
      }
    },
    'ads-ready': {
      events: {
        play() {
          this.state = 'preroll?';
        },
        adskip() {
          this.state = 'content-playback';
        },
        adserror() {
          this.state = 'content-playback';
        }
      }
    },
    'preroll?': {
      enter() {
        // See Preroll.js
      },
      leave() {
        // player.clearTimeout(player.ads.adTimeoutTimeout);
      },
      events: {
        play() {
          // Moved cancelContentPlay to Preroll.js
          // cancelContentPlay(player);
        },
        adstart() {
          this.state = 'ad-playback';
          // player.ads.adType = 'preroll';
        },
        adskip() {
          this.state = 'content-playback';
        },
        adtimeout() {
          this.state = 'content-playback';
        },
        adserror() {
          this.state = 'content-playback';
        },
        nopreroll() {
          this.state = 'content-playback';
        }
      }
    },
    'ads-ready?': {
      enter() {
        // player.addClass('vjs-ad-loading');
        // player.ads.adTimeoutTimeout = player.setTimeout(function() {
        //   player.trigger('adtimeout');
        // }, settings.timeout);
      },
      leave() {
        // player.removeClass('vjs-ad-loading');
      },
      events: {
        play() {
          // cancelContentPlay(player);
        },
        adscanceled() {
          this.state = 'content-playback';
        },
        adsready() {
          this.state = 'preroll?';
        },
        adskip() {
          this.state = 'content-playback';
        },
        adtimeout() {
          this.state = 'content-playback';
        },
        adserror() {
          this.state = 'content-playback';
        }
      }
    },
    'ad-playback': {
      enter() {
        // See AdState.js
      },
      leave() {
        // See AdState.js
      },
      events: {
        adend() {
          this.state = 'content-resuming';
        },
        adserror() {
          // player.ads.endLinearAdMode();
        }
      }
    },
    'content-resuming': {
      enter() {
        // See AdState.js
      },
      leave() {
        // player.clearTimeout(player.ads._fireEndedTimeout);
      },
      events: {
        contentupdate() {
          this.state = 'content-set';
        },

        // This is for stitched ads only.
        contentresumed() {
          this.state = 'content-playback';
        },
        playing() {
          this.state = 'content-playback';
        },
        ended() {
          this.state = 'content-playback';
        }
      }
    },
    'postroll?': {
      enter() {
        player.ads._contentEnding = true;

        if (player.ads.nopostroll_) {
          player.setTimeout(function() {
            // content-resuming happens after the timeout for backward-compatibility
            // with plugins that relied on a postrollTimeout before nopostroll was
            // implemented
            player.ads.state = 'content-resuming';
            player.trigger('ended');
          }, 1);
        } else {
          player.addClass('vjs-ad-loading');

          player.ads.adTimeoutTimeout = player.setTimeout(function() {
            player.trigger('adtimeout');
          }, settings.postrollTimeout);
        }
      },
      leave() {
        player.clearTimeout(player.ads.adTimeoutTimeout);
        player.removeClass('vjs-ad-loading');
      },
      events: {
        adstart() {
          this.state = 'ad-playback';
          // player.ads.adType = 'postroll';
        },
        adskip() {
          this.state = 'content-resuming';
          player.setTimeout(function() {
            player.trigger('ended');
          }, 1);
        },
        adtimeout() {
          this.state = 'content-resuming';
          player.setTimeout(function() {
            player.trigger('ended');
          }, 1);
        },
        adserror() {
          this.state = 'content-resuming';
          player.setTimeout(function() {
            player.trigger('ended');
          }, 1);
        },
        contentupdate() {
          this.state = 'ads-ready?';
        }
      }
    },
    'content-playback': {
      enter() {
        // Moved to ContentPlayback.js
      },
      events: {
        // In the case of a timeout, adsready might come in late.
        // This assumes the behavior that if an ad times out, it could still
        // interrupt the content and start playing. An integration could
        // still decide to behave otherwise.
        adsready() {
          // player.trigger('readyforpreroll');
        },
        adstart() {
          this.state = 'ad-playback';
          // This is a special case in which preroll is specifically set
          // if (player.ads.adType !== 'preroll') {
          //   player.ads.adType = 'midroll';
          // }
        },
        contentupdate() {
          if (player.paused()) {
            this.state = 'content-set';
          } else {
            this.state = 'ads-ready?';
          }
        },
        contentended() {
          if (this._contentHasEnded) {
            this.state = 'content-resuming';
          }
        }
      }
    }
  };

  const processEvent = function(event) {

    const state = player.ads.state;

    // Execute the current state's handler for this event
    const eventHandlers = states[state].events;

    if (eventHandlers) {
      const handler = eventHandlers[event.type];

      if (handler) {
        handler.apply(player.ads);
      }
    }

    // If the state has changed...
    if (state !== player.ads.state) {
      const previousState = state;
      const newState = player.ads.state;

      // Record the event that caused the state transition
      player.ads.triggerevent = event.type;

      // Execute "leave" method for the previous state
      if (states[previousState].leave) {
        states[previousState].leave.apply(player.ads);
      }

      // Execute "enter" method for the new state
      if (states[newState].enter) {
        states[newState].enter.apply(player.ads);
      }

      // Debug log message for state changes
      if (settings.debug) {
        videojs.log('ads', player.ads.triggerevent + ' triggered: ' +
          previousState + ' -> ' + newState);
      }
    }

  };

  // A utility method for textTrackChangeHandler to define the conditions
  // when text tracks should be disabled.
  // Currently this includes:
  //  - on iOS with native text tracks, during an ad playing
  const shouldDisableTracks = function() {
    // If the platform matches iOS with native text tracks
    // and this occurs during ad playback, we should disable tracks again.
    // If shouldPlayContentBehindAd, no special handling is needed.
    return !player.ads.shouldPlayContentBehindAd(player) &&
            player.ads.isAdPlaying() &&
            player.tech_.featuresNativeTextTracks &&
            videojs.browser.IS_IOS &&
            // older versions of video.js did not use an emulated textTrackList
            !Array.isArray(player.textTracks());
  };

  /*
   * iOS Safari will change caption mode to 'showing' if a user previously
   * turned captions on manually for that video source, so this TextTrackList
   * 'change' event handler will re-disable them in case that occurs during ad playback
   */
  const textTrackChangeHandler = function() {
    const textTrackList = player.textTracks();

    if (shouldDisableTracks()) {
      // We must double check all tracks
      for (let i = 0; i < textTrackList.length; i++) {
        const track = textTrackList[i];

        if (track.mode === 'showing') {
          track.mode = 'disabled';
        }
      }
    }
  };

  // Add the listener to the text track list
  player.ready(function() {
    player.textTracks().addEventListener('change', textTrackChangeHandler);
  });

  // Register our handler for the events that the state machine will process
  player.on(VIDEO_EVENTS.concat([
    // Events emitted by this plugin
    'adtimeout',
    'contentupdate',
    'contentplaying',
    'contentended',
    'contentresumed',
    // Triggered by startLinearAdMode()
    'adstart',
    // Triggered by endLinearAdMode()
    'adend',
    // Triggered by skipLinearAdMode()
    'adskip',

    // Events emitted by integrations
    'adsready',
    'adserror',
    'adscanceled',
    'nopreroll'

  ]), processEvent);

  // Event handling for the current state.
  // TODO this can be moved somewhere else after the state machine is removed.
  // For now it has to be after it.
  player.on([
    'play', 'playing', 'ended',
    'adsready', 'adscanceled', 'adskip', 'adserror', 'adtimeout',
    'contentupdate', 'contentresumed', 'contentended'], (e) => {
    player.ads.stateInstance.handleEvent(e.type);
  });

  // Clear timeouts and handlers when player is disposed
  player.on('dispose', function() {
    if (player.ads.adTimeoutTimeout) {
      player.clearTimeout(player.ads.adTimeoutTimeout);
    }

    if (player.ads._fireEndedTimeout) {
      player.clearTimeout(player.ads._fireEndedTimeout);
    }

    if (player.ads.cancelPlayTimeout) {
      player.clearTimeout(player.ads.cancelPlayTimeout);
    }

    if (player.ads.tryToResumeTimeout_) {
      player.clearTimeout(player.ads.tryToResumeTimeout_);
    }

    player.textTracks().removeEventListener('change', textTrackChangeHandler);
  });

  // If we're autoplaying, the state machine will immidiately process
  // a synthetic play event
  if (!player.paused()) {
    processEvent({type: 'play'});
  }

};

const registerPlugin = videojs.registerPlugin || videojs.plugin;

// Register this plugin with videojs
registerPlugin('ads', contribAdsPlugin);

export default contribAdsPlugin;
