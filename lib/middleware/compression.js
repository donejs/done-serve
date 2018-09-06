const compression = require("compression");
const {isHTTP1} = require("../http1");

module.exports = function() {
	const mw = compression();

	return function(req, res, next) {
		let response;
		if(!isHTTP1(req)) {
			response = Object.create(res, {
				_implicitHeader: {
					value: function(){
						this.writeHead(this.statusCode);
					}
				}
			});
		} else {
			response = res;
		}

		mw(req, response, next);
	}
};
