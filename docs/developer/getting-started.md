# Getting started developing videojs-contrib-ads

## Testing

### Using command line

```sh
npm run test
```

### In browser

Run `./node_modules/.bin/karma start --no-single-run --browsers Chrome test/karma.conf.js` then open `localhost:9876/debug.html`

## Building

The ads plugin is designed to be built with `npm`.

If you don't already have `npm`, then download and install [Node.js](http://nodejs.org/) (which comes with npm).

With NPM ready, you can download the ads plugin's build-time dependencies and then build the ads plugin.
Open a terminal to the directory where you've cloned this repository, then:

```sh
$ npm install
$ npm run build
```

We will run a suite of unit tests and code formatting checks, then create a `dist/` directory.
Inside you'll find the minified ads plugin file `videojs.ads.min.js`, the unminified `videojs.ads.js`, and the CSS `videojs.ads.css`.
