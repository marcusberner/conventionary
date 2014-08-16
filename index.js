module.exports = function(options, callback) {

	var app = require('express')(),
		sandal = require('./lib/init/registerDependencies.js')();

	require('./lib/init/loadWidgets.js')(sandal, function (err) {
		if (err) return callback(err);
		require('./lib/init/loadRoutes.js')(app, sandal, function (err) {
			if (err) return callback(err);
			require('./lib/init/registerLessRoute.js')(app, options);
			require('./lib/init/registerScriptRoute.js')(app, options);
			require('./lib/init/registerStaticRoute.js')(app, options);
			callback(null, app);
		});
	});

};
