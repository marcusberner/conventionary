
module.exports = function (app, express, options) {

	return function(callback) {
		app.use(express.static(options.staticPath));
		callback();
	}

};
