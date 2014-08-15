module.exports = function(options, callback) {

	var app = require('express')();

	require('./lib/init/loadWidgets.js')();
	require('./lib/init/loadRoutes.js')(app);
	require('./lib/init/registerLessRoute.js')(app, options);
	require('./lib/init/registerScriptRoute.js')(app, options);
	require('./lib/init/registerStaticRoute.js')(app, options);

	callback(null, app);


};
