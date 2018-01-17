import {State, Preroll, BeforePreroll, ContentPlayback} from '../RenameMe.js';

/*
 * This class contains logic for all ads, be they prerolls, midrolls, or postrolls.
 * Primarily, this involves handling startLinearAdMode and endLinearAdMode.
 * It also handles content resuming.
 */
export default class AdState extends State {

  constructor(player) {
    super(player);
    this.contentResuming = false;
  }

  isAdState() {
    return true;
  }

  onContentUpdate() {
    // If the source changes while resuming content, go back to initial state
    // for the new source.
    if (this.contentResuming) {
      this.player.ads.stateInstance = new BeforePreroll(this.player);
    }

    // If the source changes while preparing for a postroll, go to Preroll state.
    // This matches pre-refactor behavior, but I couldn't find specific justificaiton
    // in the project history.
    // TODO I think it's because this time is considered to be "playing" so you
    // wouldn't want to wait for a play event afterwards.
    if (this.name === 'Postroll' && !this.player.ads._inLinearAdMode) {
      this.player.ads.stateInstance = new Preroll(this.player);
    }
  }

  /*
   * We end the content-resuming process on the playing event because this is the exact
   * moment that ad playback is no longer blocked by ads.
   */
  onPlaying() {
    if (this.contentResuming) {
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  /*
   * If the integration does result in a playing event when resuming content after an ad,
   * they should instead trigger a contentresumed event to signal that content should
   * resume. The main use case for this is when ads are stitched into the content video.
   */
  onContentResumed() {
    if (this.contentResuming) {
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  isContentResuming() {
    return this.contentResuming;
  }

}
