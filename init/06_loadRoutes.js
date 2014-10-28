
var path = require('path'),
	async = require('async'),
	glob = require('glob');

module.exports = function (app, options, siteSandal, renderTemplate) {

	var registerRoute = function (route, defaultTemplate) {

		var method = route.method ? route.method.toLowerCase() : 'get';

		if (route.handler) return app[method](route.path, route.handler);

		app[method](route.path, function(req, res, next){
			var test = route.test || function (testRequest, testCallback) { testCallback(null, true); },
				factory = route.factory || function (testRequest, factoryCallback) { factoryCallback(null, {}); };
			var that = {};
			test.bind(that)(req, function (err, result) {
				if (err) return next(err);
				if (!result) return next();
				factory.bind(that)(req, function (err, routeModel, routeOptions) {
					if (err) return next(err);
					routeModel = routeModel || {};
					routeOptions = routeOptions || {};
					options.routeMap(routeModel, routeOptions, function (err, mappedModel, mappedOptions) {
						if (err) return next(err);
						routeModel = mappedModel || routeModel;
						routeOptions = mappedOptions || routeOptions;
						if (routeOptions.template) defaultTemplate = path.join(defaultTemplate, '../', routeOptions.template);
						renderTemplate(defaultTemplate, routeModel, function (err, html) {
							if (err) return next(err);
							res.set({
								'Content-Type': 'text/html'
							});
							res.send(html);
						});
					});
				});

			});
		});
	};


	return function (callback) {

		glob(path.join(options.routePath, '**/*.js'), function (err, jsFiles) {
			if (err) return callback(err);
			var routes = [];
			jsFiles.forEach(function (jsFile) {
				routes.push({
					backend: require(jsFile),
					template: jsFile.replace(/\.js$/i, '.html')
				});
			});
			routes.sort(function (a, b) {
				a.sortOrder = a.sortOrder || 0;
				b.sortOrder = b.sortOrder || 0;
				return a.sortOrder - b.sortOrder;
			});

			async.eachSeries(routes, function (route, routeCallback) {
				if (typeof route.backend === 'function') {
					siteSandal.resolveAsFactory(route.backend, function (err, resolved) {
						if (err) return routeCallback(err);
						registerRoute(resolved, route.template);
						routeCallback();
					});
				} else {
					registerRoute(route.backend, route.template);
					routeCallback();
				}
			}, function (err) {
				callback(err);
			});
		});

	};

};