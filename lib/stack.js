
module.exports = function(layers) {
	let stack = core;
	
	layers.reverse().forEach(function(layer) {
		let child = stack;
		stack = function(a, b, next) {
			try {
				layer(a, b, function(err) {
					if(err) {
						return next(err);
					}
					child(a, b, next);
				});
			} catch(err) {
				next(err);
			}
		};
	});

	return stack;
};

function core(a, b, next) {
	next();
}
