// jshint ignore: start
var assert = require('assert');
var path = require('path');
var helpers = require('./helpers');
var http = require('http');
var socketio = require('socket.io');
var socketClient = require('socket.io-client');

var serve = require('../lib/index');
var ssr = require('../lib/middleware/ssr');

// Run the tests in both http and http2
runTests(helpers.modes.H2);
runTests(helpers.modes.H1);

function runTests(mode) {
	const request = helpers.makeRequest(mode);
	const createServerOptions = helpers.makeCreateServerOptions(mode);

	describe('done-serve server (custom middleware) - ' + mode, function() {
		this.timeout(10000);

		var server, other, io;
		var middlewareCalled = false;

		before(function(done) {
			server = serve(5050, createServerOptions({
				path: path.join(__dirname, 'tests'),
				proxy: 'http://localhost:6060',
				proxyTo: 'testing',
				logErrors: false,
				liveReload: true,
				ssr: function(steal, options) {
					middlewareCalled = true;
					return ssr(steal, options);
				}
			}));

			other = http.createServer(function(req, res) {
				if(req.url === '/stuff.ndjson') {
					res.writeHead(200, {'Content-Type': 'application/x-ndjson'});
					res.write('{"row": "one"}\n');
					res.write('{"row": "two"}');
					res.end();
				} else {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('Other server\n');
				}
			}).listen(6060);

			io = socketio().listen(other);

			server.on('listening', done);
		});

		after(function(done) {
			var closed = 0;
			var onClose = function(){
				closed++;
				if(closed === 2) {
					done();
				}
			};
			server.close(onClose)
			other.close(onClose)
		});

		it('Basics works', async function() {
			let [err, res] = await request('http://localhost:5050');
			assert.equal(res.statusCode, 200);
			assert.ok(/You are home/.test(res.body), 'Got body');
		});

		it('Middleware was used', async function() {
			assert.equal(middlewareCalled, true, "Custom middleware used");
		})
	});
}
