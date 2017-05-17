[![Build Status](https://travis-ci.org/donejs/done-serve.svg?branch=master)](https://travis-ci.org/donejs/done-serve)
[![npm version](https://badge.fury.io/js/done-serve.svg)](http://badge.fury.io/js/done-serve)

# done-serve

A simple development server for DoneJS projects.

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
  - <code>[-p, --port](#-p---port)</code>
  - <code>[-r, --proxy](#-r---proxy)</code>
  - <code>[-t, --proxy-to](#-t---proxy-to)</code>
  - <code>[--proxy-no-cert-check](#--proxy-no-cert-check)</code>
  - <code>[-d, --develop](#-d---develop)</code>
  - <code>[-s, --static](#-s--static)</code>
  - <code>[--error-page](#--error-page)</code>
  - <code>[--timeout](#--timeout)</code>
  - <code>[--debug](#--debug)</code>
  - <code>[--key](#--key)</code>
  - <code>[--cert](#--cert)</code>

## Install

```
npm install done-serve
```

## Usage

```
node_modules/.bin/done-serve [path] [options]
```

`[path]` is the root directory. Defaults to the current working directory.

To start a full server that hosts your application from the `./dist` directory on port `3030` run:

```
node_modules/.bin/done-serve dist --port 3030
```

## Options

The following `[options]` can be specified from the command line:

### -p, --port

Specify the **port** the server should run on. If unspecified this port will be one of:

* the `PORT` environment variable
* `3030`

### -r, --proxy

Proxy a local path (default: `/api`) to the given URL (e.g. `http://api.myapp.com`).

### -t, --proxy-to

Set the proxy endpoint (default: `/api`).

### --proxy-no-cert-check

Turn off SSL certificate verification.

### -d, --develop

Start a [live-reload](http://stealjs.com/docs/steal.live-reload.html) server so any code changes will be reflected immediately.

### -s, --static

Only serve static files, do not perform server-side rendering. Notably this is useful when debugging an issue in the app.

### --error-page <filename>

With the `--static` flag set, set an HTML page that should be sent instead of the normal error page. This is useful when you want to use Pushstate without server side rendering.

### --auth-cookie

Specifies the name of a cookie that [done-ssr](https://github.com/donejs/done-ssr#options) will use to enable JavaScript Web Token (JWT) auth.

### --auth-domains

A comma-separated string of domain names that are authorized to receive the JWT token.  Required if `--auth-cookie` is used.

### --timeout

Specify a timeout for server rendering. If the timeout is exceeded the server will return whatever has been rendered up until that point. (default: `5000`)

### --debug

Enable debug information in case of a timeout. The debug information will be appended to the document as a modal window and provides stack traces. Only use this flag during development.

### --key, --cert

Provide SSL key and certificate files. When providing these options both HTTP and HTTP2 servers will be set up, with automatic forwarding.

```shell
done-serve --static --key ~/.localhost-ssl/private.pem --cert ~/.localhost-ssl/cert.pem
```

## Usage in Node

You can also use the server, with the same options, from JavaScript:

```js
var server = require("done-serve");

server({
path: "path/to/dir"
});
```

## License

MIT
