// jshint ignore: start
var assert = require('assert');
var path = require('path');
const helpers = require("./helpers");
var http = require('http');
var socketio = require('socket.io');
var socketClient = require('socket.io-client');
var serve = require('../lib/index');

runTests(helpers.modes.H1);

function runTests(mode) {
	const request = helpers.makeRequest(mode);
	const createServerOptions = helpers.makeCreateServerOptions(mode);

	describe('done-serve server_path - ' + mode, function() {
		this.timeout(10000);

		var server, other, io;

		before(function(done) {
			server = serve(5050, {
				path: path.join(__dirname, 'tests'),
				proxy: 'http://localhost:6060/api',
			});

			other = http.createServer(function(req, res) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('Other server\n');
			}).listen(6060);

			io = socketio().listen(other);

			server.on('listening', done);
		});

		after(function(done) {
			server.close(() => other.close(done));
		});

		it('proxies to other servers on a path', async function() {
			let [err, res] = await request('http://localhost:5050/api/');
			assert.equal(res.body, 'Other server\n', 'Got message from other server');
		});

		describe.skip('proxying socket.io websockets', function(){
			beforeEach(function(){
				this.oldDocument = global.document;
				delete global.document;
			});

			afterEach(function(){
				global.document = this.document;
			});

			it('proxies Socket.io websockets', function(done) {
				const expected = { hello: 'world' };

				io.on('connection', function (socket) {
				  socket.emit('news', original);
				});

				var socket = socketClient('http://localhost:5050');

				socket.on('news', function(data) {
					assert.deepEqual(data, expected);
					socket.disconnect();
				});

				socket.on('disconnect', function() {
					// Timeout for Socket.io cleanup on slower machiens (like CI) finish
					setTimeout(function() {
						done();
					}, 500);
				});
			});

		});
	});
}
