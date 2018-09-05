
module.exports = function() {
	return function(headers, stream, next) {
		next();
	};
};
