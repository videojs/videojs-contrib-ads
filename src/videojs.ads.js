/**
 * Basic Ad support plugin for video.js.
 *
 * Common code to support ad integrations.
 */
(function(window, videojs, undefined) {
'use strict';

var

  VIDEO_EVENTS = videojs.getComponent('Html5').Events,

  /**
   * Pause the player so that ads can play, then play again when ads are done.
   * This makes sure the player is paused during ad loading.
   *
   * The timeout is necessary because pausing a video element while processing a `play`
   * event on iOS can cause the video element to continuously toggle between playing and
   * paused states.
   *
   * @param {object} player The video player
   */
  cancelContentPlay = function(player) {
    if (player.ads.cancelPlayTimeout) {
      // another cancellation is already in flight, so do nothing
      return;
    }

    // Avoid content flash on non-iPad iOS
    if (videojs.browser.IS_IOS) {

      var width = player.currentWidth ? player.currentWidth() : player.width();
      var height = player.currentHeight ? player.currentHeight() : player.height();

      // A placeholder black box will be shown in the document while the player is hidden.
      var placeholder = document.createElement('div');
      placeholder.style.width = width + 'px';
      placeholder.style.height = height + 'px';
      placeholder.style.background = 'black';
      player.el_.parentNode.insertBefore(placeholder, player.el_);

      // Hide the player. While in full-screen video playback mode on iOS, this
      // makes the player show a black screen instead of content flash.
      player.el_.style.display = 'none';

      // Unhide the player and remove the placeholder once we're ready to move on.
      player.one(['adplaying', 'adtimeout', 'adserror', 'adscanceled', 'adskip',
                  'contentplayback'], function() {
        player.el_.style.display = 'block';
        placeholder.remove();
      });
    }
    
    player.ads.cancelPlayTimeout = window.setTimeout(function() {
      // deregister the cancel timeout so subsequent cancels are scheduled
      player.ads.cancelPlayTimeout = null;

      // pause playback so ads can be handled.
      if (!player.paused()) {
        player.pause();
      }

      // add a contentplayback handler to resume playback when ads finish.
      player.one('contentplayback', function() {
        if (player.paused()) {
          player.play();
        }
      });
    }, 1);
  },

  /**
   * Returns an object that captures the portions of player state relevant to
   * video playback. The result of this function can be passed to
   * restorePlayerSnapshot with a player to return the player to the state it
   * was in when this function was invoked.
   * @param {object} player The videojs player object
   */
  getPlayerSnapshot = function(player) {

    var currentTime;

    if (videojs.browser.IS_IOS && player.ads.isLive(player)) {
      // Record how far behind live we are
      if (player.seekable().length > 0) {
        currentTime = player.currentTime() - player.seekable().end(0);
      } else {
        currentTime = player.currentTime();
      }
    } else {
      currentTime = player.currentTime();
    }

    var
      tech = player.$('.vjs-tech'),
      tracks = player.remoteTextTracks ? player.remoteTextTracks() : [],
      track,
      i,
      suppressedTracks = [],
      snapshot = {
        ended: player.ended(),
        currentSrc: player.currentSrc(),
        src: player.src(),
        currentTime: currentTime,
        type: player.currentType()
      };

    if (tech) {
      snapshot.nativePoster = tech.poster;
      snapshot.style = tech.getAttribute('style');
    }

    i = tracks.length;
    while (i--) {
      track = tracks[i];
      suppressedTracks.push({
        track: track,
        mode: track.mode
      });
      track.mode = 'disabled';
    }
    snapshot.suppressedTracks = suppressedTracks;

    return snapshot;
  },

  /**
   * Attempts to modify the specified player so that its state is equivalent to
   * the state of the snapshot.
   * @param {object} snapshot - the player state to apply
   */
  restorePlayerSnapshot = function(player, snapshot) {
    if (player.ads.disableNextSnapshotRestore === true) {
      player.ads.disableNextSnapshotRestore = false;
      return;
    }
    var
      // the playback tech
      tech = player.$('.vjs-tech'),

      // the number of remaining attempts to restore the snapshot
      attempts = 20,

      suppressedTracks = snapshot.suppressedTracks,
      trackSnapshot,
      restoreTracks =  function() {
        var i = suppressedTracks.length;
        while (i--) {
          trackSnapshot = suppressedTracks[i];
          trackSnapshot.track.mode = trackSnapshot.mode;
        }
      },

      // finish restoring the playback state
      resume = function() {
        var currentTime;

        if (videojs.browser.IS_IOS && player.ads.isLive(player)) {
          if (snapshot.currentTime < 0) {
            // Playback was behind real time, so seek backwards to match
            if (player.seekable().length > 0) {
              currentTime = player.seekable().end(0) + snapshot.currentTime;
            } else {
              currentTime = player.currentTime();
            }
            player.currentTime(currentTime);
          }
        } else {
          player.currentTime(snapshot.ended ? player.duration() : snapshot.currentTime);
        }

        // Resume playback if this wasn't a postroll
        if (!snapshot.ended) {
          player.play();
        }
      },

      // determine if the video element has loaded enough of the snapshot source
      // to be ready to apply the rest of the state
      tryToResume = function() {

        // tryToResume can either have been called through the `contentcanplay`
        // event or fired through setTimeout.
        // When tryToResume is called, we should make sure to clear out the other
        // way it could've been called by removing the listener and clearing out
        // the timeout.
        player.off('contentcanplay', tryToResume);
        if (player.ads.tryToResumeTimeout_) {
          player.clearTimeout(player.ads.tryToResumeTimeout_);
          player.ads.tryToResumeTimeout_ = null;
        }

        // Tech may have changed depending on the differences in sources of the
        // original video and that of the ad
        tech = player.el().querySelector('.vjs-tech');

        if (tech.readyState > 1) {
          // some browsers and media aren't "seekable".
          // readyState greater than 1 allows for seeking without exceptions
          return resume();
        }

        if (tech.seekable === undefined) {
          // if the tech doesn't expose the seekable time ranges, try to
          // resume playback immediately
          return resume();
        }

        if (tech.seekable.length > 0) {
          // if some period of the video is seekable, resume playback
          return resume();
        }

        // delay a bit and then check again unless we're out of attempts
        if (attempts--) {
          window.setTimeout(tryToResume, 50);
        } else {
          (function() {
            try {
              resume();
            } catch(e) {
              videojs.log.warn('Failed to resume the content after an advertisement', e);
            }
          })();
        }
      };

    if (snapshot.nativePoster) {
      tech.poster = snapshot.nativePoster;
    }

    if ('style' in snapshot) {
      // overwrite all css style properties to restore state precisely
      tech.setAttribute('style', snapshot.style || '');
    }

    // Determine whether the player needs to be restored to its state
    // before ad playback began. With a custom ad display or burned-in
    // ads, the content player state hasn't been modified and so no
    // restoration is required

    if (player.ads.videoElementRecycled()) {
      // on ios7, fiddling with textTracks too early will cause safari to crash
      player.one('contentloadedmetadata', restoreTracks);

      // if the src changed for ad playback, reset it
      player.src({ src: snapshot.currentSrc, type: snapshot.type });
      // safari requires a call to `load` to pick up a changed source
      player.load();
      // and then resume from the snapshots time once the original src has loaded
      // in some browsers (firefox) `canplay` may not fire correctly.
      // Reace the `canplay` event with a timeout.
      player.one('contentcanplay', tryToResume);
      player.ads.tryToResumeTimeout_ = player.setTimeout(tryToResume, 2000);
    } else if (!player.ended() || !snapshot.ended) {
      // if we didn't change the src, just restore the tracks
      restoreTracks();
      // the src didn't change and this wasn't a postroll
      // just resume playback at the current time.
      player.play();
    }
  },

  /**
   * Remove the poster attribute from the video element tech, if present. When
   * reusing a video element for multiple videos, the poster image will briefly
   * reappear while the new source loads. Removing the attribute ahead of time
   * prevents the poster from showing up between videos.
   * @param {object} player The videojs player object
   */
  removeNativePoster = function(player) {
    var tech = player.$('.vjs-tech');
    if (tech) {
      tech.removeAttribute('poster');
    }
  },

  // ---------------------------------------------------------------------------
  // Ad Framework
  // ---------------------------------------------------------------------------

  // default framework settings
  defaults = {
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
  },

  adFramework = function(options) {
    var player = this;
    var settings = videojs.mergeOptions(defaults, options);
    var fsmHandler;

    // prefix all video element events during ad playback
    // if the video element emits ad-related events directly,
    // plugins that aren't ad-aware will break. prefixing allows
    // plugins that wish to handle ad events to do so while
    // avoiding the complexity for common usage
    (function() {
      var videoEvents = VIDEO_EVENTS.concat([
        'firstplay',
        'loadedalldata',
        'playing'
      ]);

      var returnTrue = function() { return true; };

      var triggerEvent = function(type, event) {
        // pretend we called stopImmediatePropagation because we want the native
        // element events to continue propagating
        event.isImmediatePropagationStopped = returnTrue;
        event.cancelBubble = true;
        event.isPropagationStopped = returnTrue;
        player.trigger({
          type: type + event.type,
          state: player.ads.state,
          originalEvent: event
        });
      };

      player.on(videoEvents, function redispatch(event) {

        // We do a quick play/pause before we check for prerolls. This creates a "playing"
        // event. This conditional block prefixes that event so it's "adplaying" if it
        // happens while we're in the "preroll?" state. Not every browser is in the
        // "preroll?" state for this event, so the following browsers come through here:
        //  * iPad
        //  * iPhone
        //  * Android
        //  * Safari
        // This is too soon to check videoElementRecycled because there is no snapshot
        // yet. We rely on the coincidence that all browsers for which
        // videoElementRecycled would be true also happen to send their initial playing
        // event during "preroll?"
        if (event.type === 'playing' && player.ads.state === 'preroll?') {
          triggerEvent('ad', event);

        // Here we send "adplaying" for browsers that send their initial "playing" event
        // (caused by the the initial play/pause) during the "ad-playback" state.
        // The following browsers come through here:
        // * Chrome
        // * IE11
        // If the ad plays in the content tech (aka videoElementRecycled) there will be
        // another playing event when the ad starts. We check videoElementRecycled to
        // avoid a second adplaying event. Thankfully, at this point a snapshot exists
        // so we can safely check videoElementRecycled.
        } else if (event.type === 'playing' &&
            player.ads.state === 'ad-playback' &&
            !player.ads.videoElementRecycled()) {
          triggerEvent('ad', event);

        // When an ad is playing in content tech, we would normally prefix
        // "playing" with "ad" to send "adplaying". However, when we did a play/pause
        // before the preroll, we already sent "adplaying". This condition prevents us
        // from sending another.
        } else if (event.type === 'playing' &&
            player.ads.state === 'ad-playback' &&
            player.ads.videoElementRecycled()) {

          // Triggering an event prevents the unprefixed one from firing.
          // "adcontentplaying" is only seen in this very specific condition.
          triggerEvent('adcontent', event);
          return;

        // When ad is playing in content tech, prefix everything with "ad".
        // This block catches many events such as emptied, play, timeupdate, and ended.
        } else if (player.ads.state === 'ad-playback') {
          if (player.ads.videoElementRecycled() || player.ads.stitchedAds()) {
            triggerEvent('ad', event);
          }

        // Send contentended if ended happens during content.
        // We will make sure an ended event is sent after postrolls.
        } else if (player.ads.state === 'content-playback' && event.type === 'ended') {
          triggerEvent('content', event);

        // Event prefixing during content resuming is complicated
        } else if (player.ads.state === 'content-resuming') {

          // This does not happen during normal circumstances. I wasn't able to reproduce
          // it, but the working theory is that it handles cases where restoring the
          // snapshot takes a long time, such as in iOS7 and older Firefox.
          if (player.ads.snapshot &&
              player.currentSrc() !== player.ads.snapshot.currentSrc) {

            // Don't prefix `loadstart` event
            if (event.type === 'loadstart') {
              return;
            }

            // All other events get "content" prefix
            return triggerEvent('content', event);
          }

          // Content resuming after postroll
          else if (player.ads.snapshot && player.ads.snapshot.ended) {

            // Don't prefix `pause` and `ended` events
            // They don't always happen during content-resuming, but they might.
            // It seems to happen most often on iOS and Android.
            if ((event.type === 'pause' ||
                event.type === 'ended')) {
              return;
            }

            // All other events get "content" prefix
            return triggerEvent('content', event);
          }

          // Content resuming after preroll or midroll
          else {

            // Events besides "playing" get "content" prefix
            if (event.type !== 'playing') {
              triggerEvent('content', event);
            }

          }
        }
      });

    })();

    // "vjs-has-started" should be present at the end of a video. In this case we need
    // to re-add it manually.
    // Not sure why this happens on ended, I've never seen a case where that is needed.
    player.on(['pause', 'ended'], function redispatch() {
      if (player.ads.state === 'content-resuming' &&
          player.ads.snapshot &&
          player.ads.snapshot.ended) {
        player.addClass('vjs-has-started');
      }
    });

    // We now auto-play when an ad gets loaded if we're playing ads in the same video element as the content.
    // The problem is that in IE11, we cannot play in addurationchange but in iOS8, we cannot play from adcanplay.
    // This will allow ad-integrations from needing to do this themselves.
    player.on(['addurationchange', 'adcanplay'], function() {
      if (player.currentSrc() === player.ads.snapshot.currentSrc) {
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

    // replace the ad initializer with the ad namespace
    player.ads = {
      state: 'content-set',
      disableNextSnapshotRestore: false,

      // Call this when an ad response has been received and there are
      // linear ads ready to be played.
      startLinearAdMode: function() {
        if (player.ads.state === 'preroll?' ||
            player.ads.state === 'content-playback' ||
            player.ads.state === 'postroll?') {
          player.trigger('adstart');
        }
      },

      // Call this when a linear ad pod has finished playing.
      endLinearAdMode: function() {
        if (player.ads.state === 'ad-playback') {
          player.trigger('adend');
          // In the case of an empty ad response, we want to make sure that
          // the vjs-ad-loading class is always removed. We could probably check for
          // duration on adPlayer for an empty ad but we remove it here just to make sure
          player.removeClass('vjs-ad-loading');
        }
      },

      // Call this when an ad response has been received but there are no
      // linear ads to be played (i.e. no ads available, or overlays).
      // This has no effect if we are already in a linear ad mode.  Always
      // use endLinearAdMode() to exit from linear ad-playback state.
      skipLinearAdMode: function() {
        if (player.ads.state !== 'ad-playback') {
          player.trigger('adskip');
        }
      },

      stitchedAds: function(arg) {
        if (arg !== undefined) {
          this._stitchedAds = !!arg;
        }
        return this._stitchedAds;
      },

      // Returns whether the video element has been modified since the
      // snapshot was taken.
      // We test both src and currentSrc because changing the src attribute to a URL that
      // AdBlocker is intercepting doesn't update currentSrc.
      videoElementRecycled: function() {
        var srcChanged;
        var currentSrcChanged;

        if (!this.snapshot) {
          throw new Error(
            'You cannot use videoElementRecycled while there is no snapshot.');
        }

        srcChanged = player.src() !== this.snapshot.src;
        currentSrcChanged = player.currentSrc() !== this.snapshot.currentSrc;

        return srcChanged || currentSrcChanged;
      },

      // Returns a boolean indicating if given player is in live mode.
      // Can be replaced when this is fixed: https://github.com/videojs/video.js/issues/3262
      isLive: function(player) {
        if (player.duration() === Infinity) {
          return true;
        } else if (videojs.browser.IOS_VERSION === "8" && player.duration() === 0) {
          return true;
        }
        return false;
      },

      // Return true if content playback should mute and continue during ad breaks.
      // This is only done during live streams on platforms where it's supported.
      // This improves speed and accuracy when returning from an ad break.
      shouldPlayContentBehindAd: function(player) {
        return !videojs.browser.IS_IOS &&
               !videojs.browser.IS_ANDROID &&
               player.duration() === Infinity;
      }

    };

    player.ads.stitchedAds(settings.stitchedAds);

    fsmHandler = function(event) {
      // Ad Playback State Machine
      var fsm = {
        'content-set': {
          events: {
            'adscanceled': function() {
              this.state = 'content-playback';
            },
            'adsready': function() {
              this.state = 'ads-ready';
            },
            'play': function() {
              this.state = 'ads-ready?';
              cancelContentPlay(player);
              // remove the poster so it doesn't flash between videos
              removeNativePoster(player);
            },
            'adserror': function() {
              this.state = 'content-playback';
            },
            'adskip': function() {
              this.state = 'content-playback';
            }
          }
        },
        'ads-ready': {
          events: {
            'play': function() {
              this.state = 'preroll?';
              cancelContentPlay(player);
            },
            'adskip': function() {
              this.state = 'content-playback';
            },
            'adserror': function() {
              this.state = 'content-playback';
            }
          }
        },
        'preroll?': {
          enter: function() {
            if (player.ads.nopreroll_) {
              // This will start the ads manager in case there are later ads
              player.trigger('readyforpreroll');

              // If we don't wait a tick, entering content-playback will cancel
              // cancelPlayTimeout, causing the video to not pause for the ad
              window.setTimeout(function() {
                // Don't wait for a preroll
                player.trigger('nopreroll');
              }, 1);
            } else {
              // change class to show that we're waiting on ads
              player.addClass('vjs-ad-loading');
              // schedule an adtimeout event to fire if we waited too long
              player.ads.adTimeoutTimeout = window.setTimeout(function() {
                player.trigger('adtimeout');
              }, settings.prerollTimeout);
              // signal to ad plugin that it's their opportunity to play a preroll
              player.trigger('readyforpreroll');
            }
          },
          leave: function() {
            window.clearTimeout(player.ads.adTimeoutTimeout);
            player.removeClass('vjs-ad-loading');
          },
          events: {
            'play': function() {
              cancelContentPlay(player);
            },
            'adstart': function() {
              this.state = 'ad-playback';
            },
            'adskip': function() {
              this.state = 'content-playback';
            },
            'adtimeout': function() {
              this.state = 'content-playback';
            },
            'adserror': function() {
              this.state = 'content-playback';
            },
            'nopreroll': function() {
              this.state = 'content-playback';
            }
          }
        },
        'ads-ready?': {
          enter: function() {
            player.addClass('vjs-ad-loading');
            player.ads.adTimeoutTimeout = window.setTimeout(function() {
              player.trigger('adtimeout');
            }, settings.timeout);
          },
          leave: function() {
            window.clearTimeout(player.ads.adTimeoutTimeout);
            player.removeClass('vjs-ad-loading');
          },
          events: {
            'play': function() {
              cancelContentPlay(player);
            },
            'adscanceled': function() {
              this.state = 'content-playback';
            },
            'adsready': function() {
              this.state = 'preroll?';
            },
            'adskip': function() {
              this.state = 'content-playback';
            },
            'adtimeout': function() {
              this.state = 'content-playback';
            },
            'adserror': function() {
              this.state = 'content-playback';
            }
          }
        },
        'ad-playback': {
          enter: function() {
            // capture current player state snapshot (playing, currentTime, src)
            if (!player.ads.shouldPlayContentBehindAd(player)) {
              this.snapshot = getPlayerSnapshot(player);
            }

            // Mute the player behind the ad
            if (player.ads.shouldPlayContentBehindAd(player)) {
              this.preAdVolume_ = player.volume();
              player.volume(0);
            }

            // add css to the element to indicate and ad is playing.
            player.addClass('vjs-ad-playing');

            // remove the poster so it doesn't flash between ads
            removeNativePoster(player);

            // We no longer need to supress play events once an ad is playing.
            // Clear it if we were.
            if (player.ads.cancelPlayTimeout) {
              // If we don't wait a tick, we could cancel the pause for cancelContentPlay,
              // resulting in content playback behind the ad
              window.setTimeout(function() {
                window.clearTimeout(player.ads.cancelPlayTimeout);
                player.ads.cancelPlayTimeout = null;
              }, 1);
            }
          },
          leave: function() {
            player.removeClass('vjs-ad-playing');
            if (!player.ads.shouldPlayContentBehindAd(player)) {
              restorePlayerSnapshot(player, this.snapshot);
            }

            // Reset the volume to pre-ad levels
            if (player.ads.shouldPlayContentBehindAd(player)) {
              player.volume(this.preAdVolume_);
            }
            
          },
          events: {
            'adend': function() {
              this.state = 'content-resuming';
            },
            'adserror': function() {
              this.state = 'content-resuming';
              //trigger 'adend' to notify that we are exiting 'ad-playback'
              player.trigger('adend');
            }
          }
        },
        'content-resuming': {
          enter: function() {
            if (this.snapshot && this.snapshot.ended) {
              window.clearTimeout(player.ads._fireEndedTimeout);
              // in some cases, ads are played in a swf or another video element
              // so we do not get an ended event in this state automatically.
              // If we don't get an ended event we can use, we need to trigger
              // one ourselves or else we won't actually ever end the current video.
              player.ads._fireEndedTimeout = window.setTimeout(function() {
                player.trigger('ended');
              }, 1000);
            }
          },
          leave: function() {
            window.clearTimeout(player.ads._fireEndedTimeout);
          },
          events: {
            'contentupdate': function() {
              this.state = 'content-set';
            },
            contentresumed: function() {
              this.state = 'content-playback';
            },
            'playing': function() {
              this.state = 'content-playback';
            },
            'ended': function() {
              this.state = 'content-playback';
            }
          }
        },
        'postroll?': {
          enter: function() {
            this.snapshot = getPlayerSnapshot(player);
            if (player.ads.nopostroll_) {
              window.setTimeout(function() {
                // content-resuming happens after the timeout for backward-compatibility
                // with plugins that relied on a postrollTimeout before nopostroll was
                // implemented
                player.ads.state = 'content-resuming';
                player.trigger('ended');
              }, 1);
            } else {
              player.addClass('vjs-ad-loading');

              player.ads.adTimeoutTimeout = window.setTimeout(function() {
                player.trigger('adtimeout');
              }, settings.postrollTimeout);
            }
          },
          leave: function() {
            window.clearTimeout(player.ads.adTimeoutTimeout);
            player.removeClass('vjs-ad-loading');
          },
          events: {
            'adstart': function() {
              this.state = 'ad-playback';
            },
            'adskip': function() {
              this.state = 'content-resuming';
              window.setTimeout(function() {
                player.trigger('ended');
              }, 1);
            },
            'adtimeout': function() {
              this.state = 'content-resuming';
              window.setTimeout(function() {
                player.trigger('ended');
              }, 1);
            },
            'adserror': function() {
              this.state = 'content-resuming';
              window.setTimeout(function() {
                player.trigger('ended');
              }, 1);
            },
            'contentupdate': function() {
              this.state = 'ads-ready?';
            }
          }
        },
        'content-playback': {
          enter: function() {
            // make sure that any cancelPlayTimeout is cleared
            if (player.ads.cancelPlayTimeout) {
              window.clearTimeout(player.ads.cancelPlayTimeout);
              player.ads.cancelPlayTimeout = null;
            }
            // this will cause content to start if a user initiated
            // 'play' event was canceled earlier.
            player.trigger({
              type: 'contentplayback',
              triggerevent: player.ads.triggerevent
            });
          },
          events: {
            // in the case of a timeout, adsready might come in late.
            'adsready': function() {
              player.trigger('readyforpreroll');
            },
            'adstart': function() {
              this.state = 'ad-playback';
            },
            'contentupdate': function() {
              if (player.paused()) {
                this.state = 'content-set';
              } else {
                this.state = 'ads-ready?';
              }
              // When a new source is loaded into the player, we should remove the snapshot
              // to avoid confusing player state with the new content's state
              // i.e When new content is set, the player should fire the ended event
              if (this.snapshot && this.snapshot.ended) {
                this.snapshot = null;
              }
            },
            'contentended': function() {
              if (player.ads.snapshot && player.ads.snapshot.ended) {
                // player has already been here. content has really ended. good-bye
                return;
              }
              this.state = 'postroll?';
            },
            'play': function() {
              if (player.currentSrc() !== player.ads.contentSrc) {
                cancelContentPlay(player);
              }
            }
          }
        }
      };

      (function(state) {
        var noop = function() {};

        // process the current event with a noop default handler
        ((fsm[state].events || {})[event.type] || noop).apply(player.ads);

        // check whether the state has changed
        if (state !== player.ads.state) {

          // record the event that caused the state transition
          player.ads.triggerevent = event.type;

          // execute leave/enter callbacks if present
          (fsm[state].leave || noop).apply(player.ads);
          (fsm[player.ads.state].enter || noop).apply(player.ads);

          // output debug logging
          if (settings.debug) {
            videojs.log('ads', player.ads.triggerevent + ' triggered: ' + state + ' -> ' + player.ads.state);
          }
        }

      })(player.ads.state);

    };

    // register for the events we're interested in
    player.on(VIDEO_EVENTS.concat([
      // events emitted by ad plugin
      'adtimeout',
      'contentupdate',
      'contentplaying',
      'contentended',
      'contentresumed',

      // events emitted by third party ad implementors
      'adsready',
      'adserror',
      'adscanceled',
      'adstart',  // startLinearAdMode()
      'adend',    // endLinearAdMode()
      'adskip',   // skipLinearAdMode()
      'nopreroll'
    ]), fsmHandler);

    // keep track of the current content source
    // if you want to change the src of the video without triggering
    // the ad workflow to restart, you can update this variable before
    // modifying the player's source
    player.ads.contentSrc = player.currentSrc();

    // implement 'contentupdate' event.
    (function(){
      var
        // check if a new src has been set, if so, trigger contentupdate
        checkSrc = function() {
          var src;
          if (player.ads.state !== 'ad-playback') {
            src = player.currentSrc();
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
      window.setTimeout(checkSrc, 1);
    })();

    // kick off the fsm
    if (!player.paused()) {
      // simulate a play event if we're autoplaying
      fsmHandler({type:'play'});
    }

  };

  // register the ad plugin framework
  videojs.plugin('ads', adFramework);

})(window, videojs);
