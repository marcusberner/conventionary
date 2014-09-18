
var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	routeCount,
	_addWidgetRenderers,
	_renderTemplate;

module.exports = function (app, options, siteSandal, addWidgetRenderers, renderTemplate, logger) {

	return function (callback) {

		_addWidgetRenderers = addWidgetRenderers;
		_renderTemplate = renderTemplate;
		routeCount = 0;

		if (!fs.existsSync(options.routePath) || !fs.statSync(options.routePath).isDirectory()) return callback();

		async.each(fs.readdirSync(options.routePath), function (file, fileCallback) {
			loadFolder(app, options.routePath, file, siteSandal	, fileCallback)
		}, function (err) {
			if (err) return callback(err);
			logger.info('Loading ' + routeCount + ' routes done');
			callback();
		});

	};

};

function loadFolder(app, parentDir, file, sandal, callback) {

	var routeDir = path.join(parentDir, file),
		routePath = path.join(routeDir, file + '.js'),
		templatePath = path.join(routeDir, file + '.html'),
		route;

	if (!fs.existsSync(routeDir) || !fs.statSync(routeDir).isDirectory()) return callback();

	async.each(fs.readdirSync(routeDir), function (file, fileCallback) {
		loadFolder(app, routeDir, file, sandal, fileCallback)
	}, function (err) {

		if (err) callback(err);
		if (!fs.existsSync(routePath) || !fs.statSync(routePath).isFile()) return callback();

		route = require(routePath);

		resolveRoute(sandal, route, function (err, resolvedRoute) {
			if (err) return callback(err);
			registerRoute(app, resolvedRoute, templatePath, callback);
		});

	});

}

function resolveRoute(sandal, route, callback) {
	if (typeof route === 'function') {
		sandal.resolveAsFactory(route, callback);
	} else {
		callback(null, route);
	}
}

function registerRoute(app, route, templatePath, callback) {

	routeCount++;

	if (route.handler) {
		app.get(route.path, route.handler);
		return callback();
	}

	app.get(route.path, function(req, res, next){
		var test = route.test || function (testRequest, testCallback) { testCallback(null, true); },
			factory = route.factory || function (testRequest, factoryCallback) { factoryCallback(null, {}); },
			requestContext = {};
		_addWidgetRenderers(requestContext);
		var that = {};
		test.bind(that)(req, function (err, result) {
			if (err) return next(err);
			if (!result) return next();
			factory.bind(that)(req, function (err, model, options) {
				if (err) return next(err);
				options = options || {};
				if (options.template) templatePath = path.join(templatePath, '../', options.template);
				_renderTemplate(templatePath, requestContext, model, function (err, html) {
					if (err) return next(err);
					res.set({
						'Content-Type': 'text/html'
					});
					res.send(html);
				});
			});

		});
	});

	callback();

}