QUnit.module('Ad Macros', window.sharedModuleHooks({}));

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

QUnit.test('player.duration', function(assert) {
  this.player.duration = function() {return 5;};
  var result = this.player.ads.adMacroReplacement('{player.duration}');

  assert.equal(result, 5);
});

QUnit.test('timestamp', function(assert) {
  this.player.duration = function() {return 5;};
  var result = this.player.ads.adMacroReplacement('{timestamp}');

  assert.equal(result, new Date().getTime());
});

QUnit.test('document.referrer', function(assert) {
  var result = this.player.ads.adMacroReplacement('{document.referrer}');

  assert.equal(
    result,
    document.referrer,
    '"' + result + '" was the document.referrer');
});

QUnit.test('window.location.href', function(assert) {
  var result = this.player.ads.adMacroReplacement('{window.location.href}');

  assert.equal(
    result,
    window.location.href,
    '"' + result + '" was the window.location.href');
});

QUnit.test('random', function(assert) {
  var result = this.player.ads.adMacroReplacement('{random}');

  assert.ok(result.match(/^\d+$/), '"' + result + '" is a random number');
});

QUnit.test('mediainfo.custom_fields', function(assert) {
  this.player.mediainfo = {
    custom_fields: {
      dog: 1,
      cat: 2,
      guinea_pig: 3
    },
    customFields: {
      dog: 1,
      cat: 2,
      guinea_pig: 3
    }
  };
  var result = this.player.ads.adMacroReplacement(
    '{mediainfo.custom_fields.dog}' +
    '{mediainfo.custom_fields.cat}' +
    '{mediainfo.custom_fields.guinea_pig}' +
    '{mediainfo.customFields.dog}' +
    '{mediainfo.customFields.cat}' +
    '{mediainfo.customFields.guinea_pig}'
  );

  assert.equal(result, '123123');
});

QUnit.test('pageVariables', function(assert) {

  window.animal = {
    dog: 'Old Buddy',
    cat: {
      maineCoon: 'Huge the Cat',
      champion: {
        name: 'Champ'
      }
    }
  };
  window.bird = null;
  window.isAwesome = true;
  window.foo = function() {};
  window.bar = {};

  var result = this.player.ads.adMacroReplacement(
    'Number: {pageVariable.scrollX}, ' +
    'Boolean: {pageVariable.isAwesome}, ' +
    'Null: {pageVariable.bird}, ' +
    'Undefined: {pageVariable.thisDoesNotExist}, ' +
    'Function: {pageVariable.foo}, ' +
    'Object: {pageVariable.bar}, ' +
    'Nested 2x: {pageVariable.animal.dog}, ' +
    'Nested 3x: {pageVariable.animal.cat.maineCoon}, ' +
    'Nested 4x: {pageVariable.animal.cat.champion.name}'
  );

  assert.equal(result,
    'Number: 0, ' +
    'Boolean: true, ' +
    'Null: null, ' +
    'Undefined: , ' +
    'Function: , ' +
    'Object: , ' +
    'Nested 2x: Old Buddy, ' +
    'Nested 3x: Huge the Cat, ' +
    'Nested 4x: Champ'
  );
});

QUnit.test('uriEncode', function(assert) {
  this.player.mediainfo = {
    custom_fields: {
      urlParam: '? &'
    }
  };
  window.foo = '& ?';
  var result = this.player.ads.adMacroReplacement(
    '{mediainfo.custom_fields.urlParam}{pageVariable.foo}', true
  );

  assert.equal(result, '%3F%20%26%26%20%3F');
});

QUnit.test('customMacros', function(assert) {
  var result = this.player.ads.adMacroReplacement(
    'The sky is {skyColor}. {exclamation}!', false, {
      '{skyColor}': 'blue',
      '{exclamation}': 'Hooray'
    }
  );

  assert.equal(result, 'The sky is blue. Hooray!');
});
