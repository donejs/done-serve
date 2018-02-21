var DefineMap = require("can-define/map/map");
require("can-route");

module.exports = DefineMap.extend({
	xhrResponse: {
		get: function(last, resolve) {
			var xhr = new XMLHttpRequest();

			xhr.addEventListener("load", function() {
				resolve( this.responseText );
			});
			xhr.addEventListener("error", function() {
				console.log( "err", this, arguments );
			});

			xhr.open("GET", "http://www.example.org/session");
			xhr.send();
		}
	},
	cookie: {
		get: function ( last, resolve ) {
			document.cookie = "newCookieKey=newCookieValue";
			resolve( document.cookie );
		}
	}
});
