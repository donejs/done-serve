const path = require("path");
const fs = require("fs");

module.exports = function(options) {
	return function(req, res, next) {
		var urlParts = path.parse(req.url);
		var isPushstateRoute = !urlParts.ext || urlParts.name.includes('?');
		if (isPushstateRoute) {
			var env = process.env.NODE_ENV || 'development';
			var htmlPath = path.join(options.path, './' + env + '.html');
			if (!fs.existsSync(htmlPath)) {
				htmlPath = path.join(options.path, './production.html');
			}
			if (fs.existsSync(htmlPath)) {
				res.writeHead(200, {
					"content-type": "text/html"
				});
				fs.createReadStream(htmlPath).pipe(res);
				return;
			}
		}
		return next();
	};
};
