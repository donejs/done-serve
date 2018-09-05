const proxy = require("./middleware/proxy");
const errorHandler = require("./middleware/error");
const fs = require("fs");

exports.create = function(port, options, app) {
	let servers = [];
	// If using TLS, set up an HTTP2 server with automatic
	// http->https forwarding.

	if(options.key && options.cert) {
		let net = require("net");
		let h2 = require("http2");

		port = Number(port);
		let httpPort = port + 1;
		let httpsPort = httpPort + 1;

		let server = h2.createSecureServer({
			key: fs.readFileSync(options.key),
			cert: fs.readFileSync(options.cert)
		});
		//server.on("stream", app);

		/*server.on("stream", (headers, stream) => {
			console.log("THIS IS A STREAM");
			debugger;
		});*/

		server.on("request", function(request, response) {
			app(request, response, errorHandler);
		});

		proxy.ws(options, server);

		server.listen(httpsPort);
		servers.push(server);

		server = require("http").createServer(function(req, res){
			var host = req.headers.host;
			res.writeHead(301, { "Location": "https://" + host + req.url });
			res.end();
		});
		server.listen(httpPort);

		// This is a TCP server that forwards to the correct port for
		// http or https
		net.createServer(function(conn){
			conn.once("data", function (buf) {
				// A TLS handshake record starts with byte 22.
				var address = (buf[0] === 22) ? httpsPort : httpPort;
				console.log("proxy to", address);
				var proxy = net.createConnection(address, function (){
					proxy.write(buf);
					conn.pipe(proxy).pipe(conn);
				});
			});
		}).listen(port);

		servers.push(server);
	} else {
		let server = require("http").createServer(app);
		server.listen(port);
		servers.push(server);
	}

	return servers;
};
