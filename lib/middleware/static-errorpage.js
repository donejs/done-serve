const fs = require("fs");
const path = require("path");

module.exports = function(options) {
	let filename = path.join(process.cwd(), options.errorPage);

	return function(req, res) {
		res.writeHead(200, {
			"content-type": "text/html"
		});
		fs.createReadStream(filename).pipe(res);
	};
}
