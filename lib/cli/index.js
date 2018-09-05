var fs = require('fs');
var path = require("path");
var program = require('commander');
var pkg = require('../../package.json');

program.version(pkg.version)
  .usage('[path] [options]')
  .description(pkg.description)
  .option('-d, --develop', 'Enable development mode (live-reload)')
  .option('-p, --port <port>', 'The server port')
  .option('-r, --proxy <url>', 'A URL to an API that should be proxied')
  .option('-t, --proxy-to <path>', 'The path to proxy to (default: /api)')
  .option('--proxy-no-cert-check', 'Turn off SSL certificate verification')
  .option('-l, --no-live-reload', 'Turn off live-reload')
  .option('--timeout <ms>', 'The timeout in milliseconds', parseInt)
  .option('--debug', 'Turn on debugging in cases of timeouts')
  .option('-s, --static', 'Only serve static files, no server-side rendering')
  .option('-h, --html5shiv', 'Include html5shiv in the HTML')
  .option('--live-reload-port <port>', 'Port to use for live-reload')
  .option('--auth-cookie <name>', 'Cookie name for supporting SSR with JWT token auth.')
  .option('--auth-domains <name>', 'Domain names where the JWT tokens will be sent. Required if auth-cookie is enabled.')
  .option('--steal-tools-path <path>', 'Location of your steal-tools')
  .option('--error-page <filename>', 'Send a given file on 404 errors to enable HTML5 pushstate (only with --static)')
  .option('--key <path>', 'Private key, for https')
  .option('--cert <path>', 'Fullchain file or cert file, for https')
  .option('--strategy <name>', 'The rendering strategy (default: safe)');

exports.program = program;

exports.run = function(){
	let createApp = require("../app");
	let createServers = require("../servers").create;
	let exec = require("child_process").exec;

	var options = {
	  path: program.args[0] ? path.join(process.cwd(), program.args[0]) : process.cwd(),
	  liveReload: program.liveReload,
	  static: program.static,
	  debug: program.debug,
	  timeout: program.timeout,
	  errorPage: program.errorPage,
	  key: program.key,
	  cert: program.cert,
	  strategy: program.strategy
	};

	if(program.proxy) {
	  options.proxy = program.proxy;
	  options.proxyTo = program.proxyTo;
	  options.proxyCertCheck = program.proxyCertCheck;
	}

	if (program.authCookie || program.authDomains) {
		options.auth = {
			cookie: program.authCookie,
			domains: program.authDomains && program.authDomains.split(',')
		};
	}

	// Spawn a child process in development mode
	if(program.develop) {
		var stealToolsPath = program.stealToolsPath ||
			path.join("node_modules", ".bin", "steal-tools");
		if(!fs.existsSync(stealToolsPath)) {
			console.error('live-reload not available: ' +
				'No local steal-tools binary found. ' +
				'Run `npm install steal-tools --save-dev`.');
		} else {
			var cmd = stealToolsPath + ' live-reload';
			if(program.liveReloadPort) {
				cmd += ' --live-reload-port ' + program.liveReloadPort;
			}

			var child = exec(cmd, {
				cwd: process.cwd()
			});

			process.env.NODE_ENV = "development";

			child.stdout.pipe(process.stdout);
			child.stderr.pipe(process.stderr);

			var killOnExit = require('kill-on-exit');
			killOnExit(child);
		}
	}

	let app = createApp(options);
	let port = program.port || process.env.PORT || 3030;
	let [mainServer] = createServers(port, options);

	mainServer.on('error', function(e) {
		if(e.code === 'EADDRINUSE') {
			console.error('ERROR: Can not start done-serve on port ' + port +
				'.\nAnother application is already using it.');
		} else {
			console.error(e);
			console.error(e.stack);
		}
	});

	mainServer.on('listening', function() {
		var address = mainServer.address();
		var url = 'http://' + (address.address === '::' ?
				'localhost' : address.address) + ':' + port;

		if(process.env.NODE_ENV === 'production') {
			console.error('Warning: done-serve is intended for development use only.');
		}

		console.log('done-serve starting on ' + url);
	});

	return mainServer;
};
