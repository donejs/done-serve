
function makeExpectation(name) {
	return function(expr) {
		var count = 0;
		var old = console[name];
		console[name] = function(err) {
			if(expr) {
				if(err && expr.test(err.toString())) {
					count++;
				}
			} else {
				count++;
			}

			//console.log('did error');
		};



		return function() {
			console[name] = old;
			return count;
		};
	};
}

exports.willError = makeExpectation('error');
