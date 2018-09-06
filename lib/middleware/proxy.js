var httpProxy = require('http-proxy');
var url = require('url');
const pathtoRegexp = require("path-to-regexp");
const {isHTTP1} = require("../http1");
var proxy = httpProxy.createProxyServer();

exports = module.exports = function (target, options, prefix) {
	let apiPath = options.proxyTo || '/api';

	if(apiPath.charAt(0) !== '/') {
		apiPath = '/' + apiPath;
	}

	if(prefix) {
		target = baseDomain(options.proxy) + prefix.substr(1);
	}

	const re = pathtoRegexp(apiPath, [], {
		end: false
	});

	function updateUrl(request) {
		request.originalUrl = request.originalUrl || request.url;
		request.url = request.url.replace(apiPath, '');
	}

	return function(req, res, next) {
		if(!re.test(req.url)) {
			next();
			return;
		}

		let [request, response] = httponeify(req, res);
		updateUrl(request);

		proxy.web(request, response, {
			target: target,
			changeOrigin: true,
			secure: options.proxyCertCheck
		}, next);
	};
};

exports.ws = function(options, server) {
	let target = baseDomain(options.proxy);

	server.on('upgrade', function(req,res) {
	  proxy.ws(req, res, {
		target
	  });
	}, logError);
};

function logError(err) {
	console.error(err);
}

function httponeify(req, res) {
	if(isHTTP1(req)) {
		return [req, res];
	}

	let headers = Object.create(null);
	for(let [key, value] of Object.entries(req.headers)) {
		if(key.startsWith(":")) {
			continue;
		}
		headers[key] = value;
	}
	let proxyableRequest = Object.create(req, {
		headers: {
			enumerable: true,
			value: headers
		}
	});

	let outHeaders = Object.create(null);

	let proxyableResponse = Object.create(res, {
		writeHead: {
			value: function(status, headers) {
				let finalHeaders = Object.assign(outHeaders, headers);
				deleteBannedHeaders(finalHeaders);
				Reflect.apply(res.writeHead, this, [status, finalHeaders]);
			}
		},
		setHeader: {
			value: function(key, value) {
				Reflect.set(outHeaders, key, value);
			}
		},
		// This prevents a warning
		statusMessage: {
			get: Function.prototype,
			set: Function.prototype
		}
	});

	return [proxyableRequest, proxyableResponse];
}

const bannedHeaders = [
	"connection",
	"transfer-encoding"
];

function deleteBannedHeaders(headers) {
	bannedHeaders.forEach(name => {
		Reflect.deleteProperty(headers, name);
	});
}

function baseDomain(proxy){
	var parsed = url.parse(proxy);
	parsed.pathname = parsed.path = '/';
	return url.format(parsed);
}
