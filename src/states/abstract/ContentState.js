import {State} from '../RenameMe.js';

export default class ContentState extends State {

  constructor(player) {
    super(player);
  }

  isAdState() {
    return false;
  }

}
