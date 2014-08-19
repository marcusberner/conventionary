
var fs = require('fs'),
	path = require('path'),
	async = require('async');

module.exports = function (app, sandal, callback) {

	var routesDir = path.join(process.cwd(), '/routes');
	if (!fs.existsSync(routesDir) || !fs.statSync(routesDir).isDirectory()) return callback();

	async.each(fs.readdirSync(routesDir), function (file, fileCallback) {
		loadFolder(app, routesDir, file, 'routes/', sandal, fileCallback)
	}, callback);

};

function loadFolder(app, parentDir, file, dependencyNamePrefix, sandal, callback) {

	var routeDir = path.join(parentDir, file),
		routePath = path.join(routeDir, file + '.js'),
		templatePath = path.join(routeDir, file + '.html'),
		route,
		dependencyName = dependencyNamePrefix + file;

	if (!fs.existsSync(routeDir) || !fs.statSync(routeDir).isDirectory()) return callback();

	async.each(fs.readdirSync(routeDir), function (file, fileCallback) {
		loadFolder(app, routeDir, file, dependencyNamePrefix + file + '.', sandal, fileCallback)
	}, function (err) {

		if (err) callback(err);
		if (!fs.existsSync(routePath) || !fs.statSync(routePath).isFile()) return callback();

		route = require(routePath);

		if (typeof route === 'function') sandal.factory(dependencyName, route);
		else sandal.object(dependencyName, route);

		sandal.resolve(dependencyName, function (err, resolvedRoute) {
			if (err) return callback(err);
			registerRoute(app, resolvedRoute, templatePath, callback);
		});

	});

}

function registerRoute(app, route, templatePath, callback) {

	if (route.handler) {
		app.get(route.path, route.handler);
		return callback();
	}

	app.get(route.path, function(req, res, next){
		var test = route.test ? route.test : function (pageContext, testCallback) { testCallback(null, true); },
			internalRequestContext = {},
			requestContext = {
				request: req
			};
		require('../utils/addWidgetRenderers.js')(internalRequestContext, requestContext);
		test(requestContext, function (err, result) {
			if (err) return next(err);
			if (!result) return next();
			require('../utils/renderTemplate')(templatePath, internalRequestContext, { title: 'Title from model' }, function (err, html) {
				if (err) return next(err);
				res.set({
					'Content-Type': 'text/html'
				});
				res.send(html);
			});
		});
	});

	callback();

}