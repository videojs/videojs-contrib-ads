/*
This feature provides an optional method for ad plugins to insert run-time values
into an ad server URL or configuration.
*/

import window from 'global/window';
import document from 'global/document';

import videojs from 'video.js';

import { tcData } from './tcf.js';

const uriEncodeIfNeeded = function(value, uriEncode) {
  return uriEncode ? encodeURIComponent(value) : value;
};

// Add custom field macros to macros object
// based on given name for custom fields property of mediainfo object.
const customFields = function(mediainfo, macros, customFieldsName) {
  if (mediainfo && mediainfo[customFieldsName]) {
    const fields = mediainfo[customFieldsName];
    const fieldNames = Object.keys(fields);

    for (let i = 0; i < fieldNames.length; i++) {
      const tag = '{mediainfo.' + customFieldsName + '.' + fieldNames[i] + '}';

      macros[tag] = fields[fieldNames[i]];
    }
  }
};

const getMediaInfoMacros = function(mediainfo, defaults) {
  const macros = {};

  ['description', 'tags', 'reference_id', 'ad_keys'].forEach((prop) => {
    if (mediainfo && mediainfo[prop]) {
      macros[`{mediainfo.${prop}}`] = mediainfo[prop];
    } else if (defaults[`{mediainfo.${prop}}`]) {
      macros[`{mediainfo.${prop}}`] = defaults[`{mediainfo.${prop}}`];
    } else {
      macros[`{mediainfo.${prop}}`] = '';
    }
  });

  ['custom_fields', 'customFields'].forEach((customFieldProp) => {
    customFields(mediainfo, macros, customFieldProp);
  });

  return macros;
};

const getDefaultValues = function(string) {
  const defaults = {};
  const modifiedString = string.replace(/{([^}=]+)=([^}]*)}/g, (match, name, defaultVal) => {
    defaults[`{${name}}`] = defaultVal;
    return `{${name}}`;
  });

  return {defaults, modifiedString};
};

const processMacroNameOverrides = function(string, macroNameOverrides) {
  const foundOverrides = {};

  for (const defaultMacro in macroNameOverrides) {
    const customMacro = macroNameOverrides[defaultMacro];

    if (string.includes(customMacro)) {
      foundOverrides[defaultMacro] = customMacro;
      string = string.replace(new RegExp(customMacro, 'g'), defaultMacro);
    }
  }

  return {string, foundOverrides};
};

const getStaticMacros = function(player) {
  return {
    '{player.id}': player.options_['data-player'] || player.id_,
    '{player.height}': player.currentHeight(),
    '{player.width}': player.currentWidth(),
    '{player.heightInt}': Math.round(player.currentHeight()),
    '{player.widthInt}': Math.round(player.currentWidth()),
    '{mediainfo.id}': player.mediainfo ? player.mediainfo.id : '',
    '{mediainfo.name}': player.mediainfo ? player.mediainfo.name : '',
    '{mediainfo.duration}': player.mediainfo ? player.mediainfo.duration : '',
    '{player.duration}': player.duration(),
    '{player.durationInt}': Math.round(player.duration()),
    '{player.pageUrl}': videojs.dom.isInFrame() ? document.referrer : window.location.href,
    '{playlistinfo.id}': player.playlistinfo ? player.playlistinfo.id : '',
    '{playlistinfo.name}': player.playlistinfo ? player.playlistinfo.name : '',
    '{timestamp}': new Date().getTime(),
    '{document.referrer}': document.referrer,
    '{window.location.href}': window.location.href,
    '{random}': Math.floor(Math.random() * 1000000000000)
  };
};

const getTcfMacros = function(tcDataObj) {
  const tcfMacros = {};

  Object.keys(tcDataObj).forEach((key) => {
    tcfMacros[`{tcf.${key}}`] = tcDataObj[key];
  });

  tcfMacros['{tcf.gdprAppliesInt}'] = tcDataObj.gdprApplies ? 1 : 0;

  return tcfMacros;
};

const getPageVariableMacros = function(string, defaults) {
  const pageVariables = string.match(/{pageVariable\.([^}]+)}/g);
  const pageVariablesMacros = {};

  if (!pageVariables) {
    return;
  }

  pageVariables.forEach((pageVar) => {
    const key = pageVar;
    const name = pageVar.slice(14, -1);
    const names = name.split('.');
    let context = window;
    let value;

    // Iterate down multiple levels of selector without using eval
    // This makes things like pageVariable.foo.bar work
    for (let i = 0; i < names.length; i++) {
      if (i === names.length - 1) {
        value = context[names[i]];
      } else {
        context = context[names[i]];
        if (typeof context === 'undefined') {
          break;
        }
      }
    }

    const type = typeof value;

    // Only allow certain types of values. Anything else is probably a mistake.
    if (value === null) {
      pageVariablesMacros[key] = 'null';
    } else if (value === undefined) {
      if (defaults[key]) {
        pageVariablesMacros[key] = defaults[key];
      } else {
        videojs.log.warn(`Page variable "${name}" not found`);
        pageVariablesMacros[key] = '';
      }
    } else if (type !== 'string' && type !== 'number' && type !== 'boolean') {
      videojs.log.warn(`Page variable "${name}" is not a supported type`);
      pageVariablesMacros[key] = '';
    } else {
      pageVariablesMacros[key] = value;
    }
  });

  return pageVariablesMacros;
};

const replaceMacros = function(string, macros, uriEncode, overrides = {}) {
  for (const macroName in macros) {
    const resolvedMacroName = overrides.hasOwnProperty(macroName) ? overrides[macroName] : macroName;

    string = string.split(resolvedMacroName).join(uriEncodeIfNeeded(macros[macroName], uriEncode));
  }
  return string;
};

/**
 *
 * @param {string} string
 *                 Any string with macros to be replaced
 * @param {boolean} uriEncode
 *                  A Boolean value indicating whether the macros should be replaced with URI-encoded values
 * @param {object} customMacros
 *                 An object with custom macros and values to map them to. For example: {'{five}': 5}
 * @param {boolean} customMacros.disableDefaultMacros
 *                  A boolean indicating whether replacement of default macros should be forgone in favor of only customMacros
 * @param {object} customMacros.macroNameOverrides
 *                 An object that specifies custom names for default macros, following the following format:
 *                 // {'{default-macro-name}': '{new-macro-name}'}
 *                 {'{player.id}': '{{PLAYER_ID}}', ...}
 * @returns {string}
 *          The provided string with all macros replaced. For example: adMacroReplacement('{player.id}') returns a string of the player id
 */
export default function adMacroReplacement(string, uriEncode = false, customMacros = {}) {
  const disableDefaultMacros = customMacros.disableDefaultMacros || false;
  const macroNameOverrides = customMacros.macroNameOverrides || {};

  // Remove special properties from customMacros
  delete customMacros.disableDefaultMacros;
  delete customMacros.macroNameOverrides;

  const macros = customMacros;
  const {string: updatedString, macrosToOverride} = processMacroNameOverrides(string, macroNameOverrides);

  string = updatedString;

  if (disableDefaultMacros) {
    return replaceMacros(string, macros, uriEncode, macrosToOverride);
  }

  // Get macros with defaults e.g. {x=y}, store the values in `defaults` and replace with standard macros in the string
  const {defaults, modifiedString} = getDefaultValues(string);

  string = modifiedString;

  // Get all macro values
  Object.assign(
    macros,
    getStaticMacros(this),
    getMediaInfoMacros(this.mediainfo, defaults),
    getTcfMacros(tcData),
    getPageVariableMacros(string, defaults)
  );

  // Perform macro replacement
  string = replaceMacros(string, macros, uriEncode, macrosToOverride);

  // Replace any remaining default values that have not already been replaced. This includes mediainfo custom fields.
  for (const macro in defaults) {
    string = string.replace(macro, defaults[macro]);
  }

  return string;
}
