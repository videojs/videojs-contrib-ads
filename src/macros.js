/*
Feature description
*/

import videojs from 'video.js';

const uriEncodeIfNeeded = function(value, uriEncode) {
  if (uriEncode) {
    encodeURIComponent(value);
  }
  return value;
}

const adMacroReplacement = function(string, uriEncode, customMacros) {

  if (uriEncode === undefined) {
    uriEncode = false;
  }

  let macros = {};

  if (customMacros !== undefined) {
    macros = customMacros;
  }

  // Static macros
  macros['{player.id}'] = this.options_['data-player'];
  macros['{mediainfo.id}'] = this.mediainfo ? this.mediainfo.id : '';
  macros['{mediainfo.name}'] = this.mediainfo ? this.mediainfo.name : '';
  macros['{mediainfo.description}'] = this.mediainfo ? this.mediainfo.description : '';
  macros['{mediainfo.tags}'] = this.mediainfo ? this.mediainfo.tags : '';
  macros['{mediainfo.reference_id}'] = this.mediainfo ? this.mediainfo.reference_id : '';
  macros['{mediainfo.duration}'] = this.mediainfo ? this.mediainfo.duration : '';
  macros['{mediainfo.ad_keys}'] = this.mediainfo ? this.mediainfo.ad_keys : '';
  macros['{player.duration}'] = this.duration();
  macros['{timestamp}'] = new Date().getTime();
  macros['{document.referrer}'] = document.referrer;
  macros['{window.location.href}'] = window.location.href;
  macros['{random}'] = Math.floor(Math.random() * 1000000000000);

  // Custom fields in mediainfo
  if (this.mediainfo && this.mediainfo.custom_fields) {
    let fields = Object.keys(this.mediainfo.custom_fields);

    for (let keys = 0; keys < fields.length; keys++) {
      const custom = '{mediainfo.custom_fields.' + fields[keys] + '}';

      macros[custom] = this.mediainfo.custom_fields[fields[keys]];
    }
  }

  // Go through all the replacement macros and apply them to the string.
  // This will replace all occurrences of the replacement macros.
  for (let i in macros) {
    string = string.split(i).join(uriEncodeIfNeeded(macros[i], uriEncode));
  }

  // Page variables
  string = string.replace(/{pageVariable\.([^}]+)}/, function(match, name) {
    let value;
    let context = window;
    let names = name.split('.');

    // Iterate down multiple levels of selector without using eval
    // This makes things like pageVariable.foo.bar work
    for (let i = 0; i < names.length; i++) {
      if (i === names.length - 1) {
        value = context[names[i]];
      } else {
        context = context[names[i]];
      }
    }

    const type = typeof value;

    // Only allow certain types of values. Anything else is probably a mistake.
    if (value === null) {
      return 'null';
    } else if (value === undefined) {
      videojs.log.warn(`Page variable "${name}" not found`);
      return '';
    } else if (type !== 'string' && type !== 'number' && type !== 'boolean') {
      videojs.log.warn(`Page variable "${name}" is not a supported`);
      return '';
    }

    return uriEncodeIfNeeded(String(value), uriEncode);
  });

  return string;

}

module.exports = adMacroReplacement;
