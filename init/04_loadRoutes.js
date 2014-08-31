
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
			loadFolder(app, options.routePath, file, 'routes/', siteSandal	, fileCallback)
		}, function (err) {
			if (err) return callback(err);
			logger.info('Loading ' + routeCount + ' routes done');
			callback();
		});

	};

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

	routeCount++;

	if (route.handler) {
		app.get(route.path, route.handler);
		return callback();
	}

	app.get(route.path, function(req, res, next){
		var test = route.test ? route.test : function (requestContext, testCallback) { testCallback(null, true); },
			factory = route.factory ? route.factory : function (requestContext, factoryCallback) { factoryCallback(null, {}); },
			internalRequestContext = {},
			requestContext = {
				request: req
			};
		_addWidgetRenderers(internalRequestContext, requestContext);
		test(requestContext, function (err, result) {
			if (err) return next(err);
			if (!result) return next();
			factory(requestContext, function (err, model, template) {
				if (err) return next(err);
				if (template) templatePath = path.join(templatePath, '../', template);
				_renderTemplate(templatePath, internalRequestContext, model, function (err, html) {
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