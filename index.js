var async = require('async');

module.exports = function(options, callback) {

	if (!callback) {
		callback = options;
		options = {};
	}

	require('./lib/init/setDefaults.js')(options);

	var express = require('express'),
		app = express(),
		sandal = require('./lib/init/registerDependencies.js')(app, options);

	sandal.resolve(function (err, init) {

		if (err) return callback(err);

		async.parallel(init, function (err) {

			if (err) return callback(err);
			sandal.remove('init');

			// Filters
			require('./lib/filters/cacheBust.js');
			require('./lib/filters/translate.js')(options.dictionaries || []);

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

		});

	});

};
