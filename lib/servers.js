const proxy = require("./middleware/proxy");
const errorHandler = require("./middleware/error");
const fs = require("fs");
const {markHTTP1} = require("./http1");

exports.create = function(port, options, app) {
	let servers = [];
	let handleErrors = errorHandler(options);

	// If using TLS, set up an HTTP2 server with automatic
	// http->https forwarding.
	if(options.key && options.cert) {
		let net = require("net");
		let h2 = require("http2");
		let http = require("http");
		let h2ResponseProto = require("./proto/h2");
		let h1ResponseProto = require("./proto/h1");

		port = Number(port);
		let httpPort = port + 1;
		let httpsPort = httpPort + 1;

		let h2Server = h2.createSecureServer({
			key: fs.readFileSync(options.key),
			cert: fs.readFileSync(options.cert),
			allowHTTP1: true
		});

		h2Server.on("request", function(request, response) {
			let proto = (request instanceof http.IncomingMessage) ?
				h1ResponseProto : h2ResponseProto;

			Object.setPrototypeOf(response, proto);

			app(request, response, handleErrors);
		});

		if(options.proxy) {
			proxy.ws(options, h2Server);
		}

		h2Server.listen(httpsPort);
		servers.push(h2Server);

		let httpServer = require("http").createServer(function(req, res){
			var host = req.headers.host;
			res.writeHead(301, { "Location": "https://" + host + req.url });
			res.end();
		});
		httpServer.listen(httpPort);

		// This is a TCP server that forwards to the correct port for
		// http or https
		let tcpServer = net.createServer(function(conn){
			conn.once("data", function (buf) {
				// A TLS handshake record starts with byte 22.
				var address = (buf[0] === 22) ? httpsPort : httpPort;
				var proxy = net.createConnection(address, function (){
					proxy.write(buf);
					conn.pipe(proxy).pipe(conn);
				});
			});
		});
		tcpServer.listen(port);

		servers.push(httpServer);

		// When the main server is closed, also close the HTTP and TCP servers.
		let _close = h2Server.close;
		h2Server.close = function(cb){
			let closed = 0;
			let onClosed = function() {
				closed++;
				if(closed === 3 && cb) {
					cb.apply(this, arguments);
				}
			};

			_close.call(this, onClosed);
			httpServer.close(onClosed);
			tcpServer.close(onClosed);
		};
	} else {
		let responseProto = require("./proto/h1");
		let server = require("http").createServer(function(request, response) {
			markHTTP1(request);
			Object.setPrototypeOf(response, responseProto);
			app(request, response, handleErrors);
		});

		if(options.proxy) {
			proxy.ws(options, server);
		}

		server.listen(port);

		servers.push(server);
	}

	return servers;
};
