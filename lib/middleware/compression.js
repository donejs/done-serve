const compression = require("compression");

module.exports = function() {
	const mw = compression();

	return function(req, res, next) {
		let response = Object.create(res, {
			_implicitHeader: {
				value: function(){
					this.writeHead(this.statusCode);
				}
			}
		});

		mw(req, response, next);
	}
};
