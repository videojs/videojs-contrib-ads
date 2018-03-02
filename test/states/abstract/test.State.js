import QUnit from 'qunit';

import {State} from '../../../src/states.js';

/*
 * These tests are intended to be isolated unit tests for one state with all
 * other modules mocked.
 */
QUnit.module('State', {
  beforeEach: function() {
    this.player = {
      ads: {
        debug: () => {}
      }
    };

    this.state = new State(this.player);
  }
});

QUnit.test('sets this.player', function(assert) {
  assert.equal(this.state.player, this.player);
});

QUnit.test('can transition to another state', function(assert) {
  let mockStateInit = false;

  class MockState {
    static _getName() {
      return 'MockState';
    }
    init() {
      mockStateInit = true;
    }
  }

  this.state.cleanup = sinon.stub();

  this.state.transitionTo(MockState);
  assert.ok(this.state.cleanup.calledOnce, 'cleaned up old state');
  assert.equal(this.player.ads._state.constructor.name, 'MockState', 'set ads._state');
  assert.equal(mockStateInit, true, 'initialized new state');
});

QUnit.test('throws error if isAdState is not implemented', function(assert) {
  let error;

  try {
    this.state.isAdState();
  } catch(e) {
    error = e;
  }
  assert.equal(error.message, 'isAdState unimplemented for Anonymous State');
});

QUnit.test('is not resuming content by default', function(assert) {
  assert.equal(this.state.isContentResuming(), false);
});

QUnit.test('is not in an ad break by default', function(assert) {
  assert.equal(this.state.inAdBreak(), false);
});

QUnit.test('handles events', function(assert) {
  this.state.onPlay = sinon.stub();
  this.state.handleEvent('play');
  assert.ok(this.state.onPlay.calledOnce);
});
