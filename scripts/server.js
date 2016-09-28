import Promise from 'bluebird';
import browserify from 'browserify';
import budo from 'budo';
import fs from 'fs';
import glob from 'glob';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import sass from 'node-sass';
import path from 'path';

/* eslint no-console: 0 */

const pkg = require(path.join(__dirname, '../package.json'));

// Replace "%s" tokens with the plugin name in a string.
const nameify = (str) =>
  str.replace(/%s/g, pkg.name.split('/').reverse()[0]);

const srces = {
  css: 'src/plugin.scss',
  js: 'src/plugin.js',
  tests: glob.sync('test/**/*.test.js')
};

const dests = {
  css: nameify('dist/%s.css'),
  js: nameify('dist/%s.js'),
  tests: 'test/dist/bundle.js'
};

const tasks = {

  sass(resolve, reject) {
    const finish = (err) => err ? reject(err.message) : resolve();

    sass.render({
      file: srces.css,
      outputStyle: 'compressed'
    }, (err, result) => {
      if (err) {
        reject(err.message);
      } else {
        fs.writeFile(dests.css, result.css, finish);
      }
    });
  },

  js: browserify({
    debug: true,
    entries: [srces.js],
    standalone: nameify('%s'),
    transform: [
      'babelify',
      ['browserify-shim', {global: true}]
    ]
  }),

  tests: browserify({
    debug: true,
    entries: srces.tests,
    transform: [
      'babelify',
      ['browserify-shim', {global: true}]
    ]
  })
};

/**
 * Runs one of the builds from the tasks object.
 *
 * @param  {String} name
 *         Should match a key from the `tasks` object.
 *
 * @return {Promise}
 */
const build = (name) => {
  if (Array.isArray(name)) {
    return Promise.all(name.map(build));
  }

  // This returns a Promise even in the case of synchronous tasks because
  // a consistent contract is useful. Ideally, we'll make the synchronous
  // tasks asynchronous, but it's not critical.
  return new Promise((resolve, reject) => {
    if (typeof tasks[name] === 'function') {
      tasks[name](resolve, reject);
    } else {
      tasks[name]
        .bundle()
        .pipe(fs.createWriteStream(dests[name]))
        .on('finish', resolve)
        .on('error', reject);
    }
  });
};

mkdirp.sync('dist');
build('sass');
// Start the server _after_ the initial bundling is done.
build(['js', 'tests']).then(() => {
  const server = budo({
    port: 9999,
    stream: process.stdout
  }).on('reload', (f) => console.log('reloading %s', f || 'everything'));

  /**
   * A collection of functions which are mapped to strings that are used to
   * generate RegExp objects. If a filepath matches the RegExp, the function
   * will be used to handle that watched file.
   *
   * @type {Object}
   */
  const handlers = {

    /**
     * Handler for Sass source.
     *
     * @param  {String} event
     * @param  {String} file
     */
    '^src/.+\.scss$': _.debounce((event, file) => {
      console.log('re-compiling sass');
      build('sass');
      server.reload();
    }),

    /**
     * Handler for JavaScript source and tests.
     *
     * @param  {String} event
     * @param  {String} file
     */
    '^(src|test)/.+\.js$': _.debounce((event, file) => {
      console.log('bundling javascript and tests');
      build(['js', 'tests']).then(() => server.reload());
    })
  };

  /**
   * Finds the first handler function for the file that matches a RegExp
   * derived from the keys.
   *
   * @param  {String} file
   * @return {Function|Undefined}
   */
  const findHandler = (file) => {
    const keys = Object.keys(handlers);

    for (let i = 0; i < keys.length; i++) {
      const regexp = new RegExp(keys[i]);

      if (regexp.test(file)) {
        return handlers[keys[i]];
      }
    }
  };

  server
    .live()
    .watch([
      'index.html',
      'src/**/*.{scss,js}',
      'test/**/*.js',
      '!test/dist/**/*.js',
      'test/index.html'
    ])
    .on('watch', (event, file) => {
      const handler = findHandler(file);

      console.log(`detected a "${event}" event in "${file}"`);

      if (handler) {
        handler(event, file);
      } else {
        server.reload();
      }
    });
});
