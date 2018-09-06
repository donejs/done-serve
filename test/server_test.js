var assert = require('assert');
var path = require('path');
var helpers = require('./helpers');
var http = require('http');
//var request = require('request');
var socketio = require('socket.io');
var socketClient = require('socket.io-client');

var serve = require('../lib/index');

// Run the tests in both http and http2
runTests("HTTP/2");

function runTests(mode) {
	const request = helpers.makeRequest(mode);

	describe('done-serve server - ' + mode, function() {
		this.timeout(10000);

		var server, other, io;

		before(function(done) {
			var serverOptions = {
				path: path.join(__dirname, 'tests'),
				proxy: 'http://localhost:6060',
				proxyTo: 'testing',
				logErrors: false,
				liveReload: true
			};

			if(mode === 'HTTP/2') {
				serverOptions.key = path.join(__dirname, "config", "key.pem");
				serverOptions.cert = path.join(__dirname, "config", "cert.pem");
			}

			server = serve(5050, serverOptions);

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
			//server.close(done);
			done();
		});

		it('starts SSR with package.json settings and outputs page with 200 status', async function() {
			let [err, res] = await request('http://localhost:5050');

			assert.equal(res.statusCode, 200);
			assert.ok(/You are home/.test(res.body), 'Got body');
		});

		it('route errors send 404 status', async function() {
			let [err, res] = await request('http://localhost:5050/invalid/route');
			assert.equal(res.statusCode, 404);
			assert.ok(/Error: Not found/.test(res.body), 'Got body');
		});

		it('proxies to other servers on a path', async function() {
			let [err, res] = await request('http://localhost:5050/testing/');
			assert.equal(res.body, 'Other server\n', 'Got message from other server');
		});

		it('proxies Socket.io websockets', function(done) {
			var original = { hello: 'world' };
			var oldDocument = global.document;

			// socket.io-client doesn't like our document shim but we don't need it for this test
			// See https://github.com/socketio/socket.io-client/issues/916
			delete global.document;

			io.on('connection', function (socket) {
			  socket.emit('news', original);
			});

			var socket = socketClient('http://localhost:6060');

			socket.on('news', function(data) {
				assert.deepEqual(data, original);
				socket.disconnect();
			});

			socket.on('disconnect', function() {
				// Timeout for Socket.io cleanup on slower machiens (like CI) finish
				setTimeout(function() {
					global.document = oldDocument;
					done();
				}, 500);
			});
		});

		it('server should parse URL parameters (#52)', async function() {
			let [err, res] = await request('http://localhost:5050/test?param=paramtest')
			assert.equal(res.statusCode, 200);
			assert.ok(/paramtest/.test(res.body), 'Param printed in body');
		});

		it('errors when rendering an app trigger Express error handler (#58)', async function() {
			let [err, res] = await request('http://localhost:5050/?err=true')
			assert.equal(res.statusCode, 500);
			assert.ok(/Something went wrong/.test(res.body), 'Got error message');
		});

		it('Error page connects to live-reload', async function() {
			let [err, res] = await request('http://localhost:5050/?err=true');
			assert.ok(/id="live-reload"/.test(res.body), "live-reload script included");
		});

		it('can serve only static content', function(done) {
			let serverOptions = {
				path: path.join(__dirname),
				static: true
			};

			if(mode === 'HTTP/2') {
				serverOptions.key = path.join(__dirname, "config", "key.pem");
				serverOptions.cert = path.join(__dirname, "config", "cert.pem");
			}

			var server = serve(8889, serverOptions);

			server.on('listening', async function() {
				let [err, res] = await request('http://localhost:8889/server_test.js');
				assert.ok(res.statusCode === 200);
				server.close(done);
			});
		});

		it('shows a nice 404 message when in static mode', function(done) {
			let serverOptions = {
				path: path.join(__dirname),
				static: true
			};

			if(mode === 'HTTP/2') {
				serverOptions.key = path.join(__dirname, "config", "key.pem");
				serverOptions.cert = path.join(__dirname, "config", "cert.pem");
			}

			var server = serve(8889, serverOptions);

			var undo = helpers.willError(/404/);

			server.on('listening', async function() {
				let [err, res] = await request('http://localhost:8889/not-exists');
				assert.equal(undo(), 1, "There was a 404 message");
				server.close(done);
			});
		});

		it.only('serves development.html when there\'s no index.html and NODE_ENV is not set', function(done) {
			var server = serve({
				path: path.join(__dirname, 'tests', 'pushstate'),
				static: true
			}).listen(8889);

			server.on('listening', function() {
				request('http://localhost:8889', function(err, res, body) {
					assert(body === 'Development');
					assert.ok(res.statusCode === 200);
					server.close(done);
				});
			});
		});

		it('serves production.html when NODE_ENV is not development', function(done) {
			process.env.NODE_ENV = 'ci';
			var server = serve({
				path: path.join(__dirname, 'tests', 'pushstate'),
				static: true
			}).listen(8889);

			server.on('listening', function() {
				request('http://localhost:8889', function(err, res, body) {
					assert(body === 'Production');
					assert.ok(res.statusCode === 200);
					delete process.env.NODE_ENV;
					server.close(done);
				});
			});
		});

		it('serves qa.html when NODE_ENV is qa', function(done) {
			process.env.NODE_ENV = 'qa';
			var server = serve({
				path: path.join(__dirname, 'tests', 'pushstate'),
				static: true
			}).listen(8889);

			server.on('listening', function() {
				request('http://localhost:8889', function(err, res, body) {
					assert(body === 'QA');
					assert.ok(res.statusCode === 200);
					delete process.env.NODE_ENV;
					server.close(done);
				});
			});
		});

		it('serves development.html for a non-matched static route (pushstate route)', function(done) {
			var server = serve({
				path: path.join(__dirname, 'tests', 'pushstate'),
				static: true
			}).listen(8889);

			server.on('listening', function() {
				request('http://localhost:8889/users', function(err, res, body) {
					assert(body === 'Development');
					assert.ok(res.statusCode === 200);
					server.close(done);
				});
			});
		});

		it('serves a custom error page in static mode', function(done) {
			var server = serve({
				path: path.join(__dirname),
				static: true,
				errorPage: path.join('test', 'tests', 'error-page.html')
			}).listen(8891);

			server.on('listening', function() {
				request('http://localhost:8891/not-a-real-page', function(err, res, body) {
					assert.ok(res.statusCode === 200);
					assert.equal(body, 'This is the error page!');
					server.close(done);
				});
			});
		});

		it('serves a directory listing in static mode', function(done) {
			var server = serve({
				path: path.join(__dirname),
				static: true,
			}).listen(8891);

			server.on('listening', function() {
				request('http://localhost:8891/', function(err, res, body) {
					assert.ok(res.statusCode === 200);

					assert.ok(/server_test\.js/.test(body), 'Got body');

					server.close(done);
				});
			});
		});

		it('does not compress application/x-ndjson', function(done) {
			var options = {
				url: 'http://localhost:5050/testing/stuff.ndjson',
				headers: {
					'accept': '*/*',
					'accept-encoding': 'gzip, deflate, br'
				}
			};

			request(options, function(err, res, body) {
				var h = res.headers;
				assert.equal(h['content-type'], 'application/x-ndjson', 'Set from the proxy');
				assert.equal(h['content-encoding'], undefined, 'gzip not set');
				done();
			});
		});

	});
}
