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
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new BeforePreroll(this.player);
    }

    // If the source changes while preparing for a postroll, go to Preroll state.
    // This matches pre-refactor behavior, but I couldn't find specific justificaiton
    // in the project history.
    if (this.name === 'Postroll' && !this.player.ads._inLinearAdMode) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new Preroll(this.player);
    }
  }

  /*
   * If the integration does result in a playing event when resuming content after an ad,
   * they should instead trigger a contentresumed event to signal that content should
   * resume.
   */
  onContentResumed() {
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  /*
   * This is the usual way for content to resume after a preroll or midroll.
   * TODO: Why does this happen here instead of on endLinearAdMode?
   */
  onPlaying() {
    if (this.contentResuming) {
      this.player.clearTimeout(this.player.ads._fireEndedTimeout);
      this.player.ads.stateInstance = new ContentPlayback(this.player);
    }
  }

  // TODO set contentResuming everywhere it's needed.
  isContentResuming() {
    return this.contentResuming;
  }

}
