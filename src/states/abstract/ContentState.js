import {State, BeforePreroll, Preroll} from '../../states.js';

export default class ContentState extends State {

  constructor(player) {
    super(player);
  }

  /*
   * Overrides State.isAdState
   */
  isAdState() {
    return false;
  }

  /*
   * Source change sends you back to preroll checks.
   */
  onContentUpdate() {
    const player = this.player;

    if (player.paused()) {
      this.transitionTo(BeforePreroll);
    } else {
      this.transitionTo(Preroll, false);
    }
  }

}
