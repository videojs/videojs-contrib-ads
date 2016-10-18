QUnit.module('Ad Macros', window.sharedModuleHooks({

  beforeEach: function() {
    
  }
}));

QUnit.test('player.id', function(assert) {
  this.player.options_['data-player'] = '12345';
  var result = this.player.ads.adMacroReplacement('{player.id}');
  
  assert.equal(result, '12345');
});

QUnit.test('mediainfo', function(assert) {
  this.player.mediainfo = {
    id: 1,
    name: 2,
    description: 3,
    tags: 4,
    reference_id: 5,
    duration: 6,
    ad_keys: 7
  };
  var result = this.player.ads.adMacroReplacement(
    '{mediainfo.id}' +
    '{mediainfo.name}' +
    '{mediainfo.description}' +
    '{mediainfo.tags}' +
    '{mediainfo.reference_id}' +
    '{mediainfo.duration}' +
    '{mediainfo.ad_keys}'
  );
  
  assert.equal(result, '1234567');
});

QUnit.test('random', function(assert) {
  var result = this.player.ads.adMacroReplacement('{random}');
  
  assert.ok(result.match(/^\d+$/), '"' + result + '" is a random number');
});
