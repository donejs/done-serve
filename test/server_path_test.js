var assert = require('assert');
var path = require('path');
var http = require('http');
var request = require('request');
var socketio = require('socket.io');
var socketClient = require('socket.io-client');

var serve = require('../lib/index');

describe('done-serve server_path', function() {
	this.timeout(10000);

	var server, other, io;

	before(function(done) {
		server = serve({
			path: path.join(__dirname, 'tests'),
			proxy: 'http://localhost:6060/api',
		}).listen(5050);

		other = http.createServer(function(req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('Other server\n');
		}).listen(6060);

		io = socketio().listen(other);

		server.on('listening', done);
	});

	after(function(done) {
		server.close(done);
	});

	it('proxies to other servers on a path', function(done) {
		request('http://localhost:5050/api/', function(err, res, body) {
			assert.equal(body, 'Other server\n', 'Got message from other server');
			done();
		});
	});

	describe('proxying socket.io websockets', function(){
		beforeEach(function(){
			this.oldDocument = global.document;
			delete global.document;
		});

		afterEach(function(){
			global.document = this.document;
		});

		it('proxies Socket.io websockets', function(done) {
			var original = { hello: 'world' };

			io.on('connection', function (socket) {
			  socket.emit('news', original);
			});

			var socket = socketClient('http://localhost:5050');

			socket.on('news', function(data) {
				assert.deepEqual(data, original);
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
