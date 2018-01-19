import {State, BeforePreroll, Preroll} from '../States.js';

export default class ContentState extends State {

  constructor(player) {
    super(player);
  }

  isAdState() {
    return false;
  }

  onContentUpdate() {
    const player = this.player;

    if (player.paused()) {
      this.transitionTo(BeforePreroll);
    } else {
      this.transitionTo(Preroll, false);
    }
  }

}
