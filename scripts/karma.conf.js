/* eslint-disable no-console */
const serveStatic = require('serve-static');
const path = require('path');
const serve = serveStatic(
  path.join(__dirname, '..'),
  {index: ['index.html', 'index.htm']}
);

const StaticMiddlewareFactory = function(config) {
  console.log(`**** Dev server started at http://${config.listenAddress}:${config.port}/ *****`);

  return function(req, res, next) {
    res.setHeader('Cache-Control', 'no-cache,must-revalidate');
    return serve(req, res, next);
  };
};

module.exports = function(config) {
  const detectBrowsers = {
    enabled: false,
    usePhantomJS: false,
    postDetection(browsers) {
      const toKeep = ['Firefox', 'Chrome'];
      const filteredBrowsers = [];

      browsers.forEach((e) => {
        if (e === 'Chrome') {
          filteredBrowsers.push('autoplayDisabledChrome');
        } else if (toKeep.indexOf(e) !== -1) {
          filteredBrowsers.push(e);
        }
      });

      return filteredBrowsers;
    }
  };

  // On Travis CI, we can only run in Firefox and Chrome; so, enforce that.
  if (process.env.TRAVIS) {
    config.browsers = ['Firefox', 'travisChrome'];
  }

  // If no browsers are specified, we enable `karma-detect-browsers`
  // this will detect all browsers that are available for testing
  if (config.browsers !== false && !config.browsers.length) {
    detectBrowsers.enabled = true;
  }

  config.set({
    basePath: '..',
    frameworks: ['qunit', 'detectBrowsers'],
    files: [
      'node_modules/video.js/dist/video-js.css',
      'node_modules/lodash/lodash.js',
      'node_modules/sinon/pkg/sinon.js',
      'node_modules/video.js/dist/video.js',
      'dist/videojs-contrib-ads.js',
      'dist/videojs-contrib-ads.css',
      'test/integration/lib/shared-module-hooks.js',
      'test/dist/bundle.js'
    ],
    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
      },
      autoplayDisabledChrome: {
        base: 'Chrome',
        flags: ['--autoplay-policy=no-user-gesture-required']
      }
    },
    client: {
      clearContext: false,
      qunit: {
        showUI: true,
        testTimeout: 15000
      }
    },
    detectBrowsers,
    reporters: ['dots'],
    port: 9999,
    urlRoot: '/test/',
    plugins: [
      {'middleware:static': ['factory', StaticMiddlewareFactory]},
      'karma-*'
    ],
    middleware: ['static'],
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: 1,
    browserNoActivityTimeout: 300000
  });
};
