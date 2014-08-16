
var fs = require('fs'),
	path = require('path'),
	async = require('async');

module.exports = function (app, sandal, callback) {

	var routesDir = path.join(process.cwd(), '/routes');
	if (!fs.existsSync(routesDir) || !fs.statSync(routesDir).isDirectory()) return callback();

	async.each(fs.readdirSync(routesDir), function (file, fileCallback) {

		var routeDir = path.join(routesDir, file),
			routePath = path.join(routeDir, file + '.js'),
			templatePath = path.join(routeDir, file + '.html'),
			route,
			dependencyName = 'routes/' + file;

		if (!fs.existsSync(routePath) || !fs.statSync(routePath).isFile()) return fileCallback();

		route = require(routePath);

		if (typeof route === 'function') sandal.factory(dependencyName, route);
		else sandal.object(dependencyName, route);

		sandal.resolve(dependencyName, function (err, resolvedRoute) {

			if (err) return fileCallback(err);

			if (resolvedRoute.handler) {
				app.get(resolvedRoute.path, resolvedRoute.handler);
				return fileCallback();
			}

			app.get(resolvedRoute.path, function(req, res, next){
				var test = resolvedRoute.test ? resolvedRoute.test : function (pageContext, callback) { callback(null, true);},
					pageContext = {
						request: req
					};
				test(pageContext, function (err, result) {
					if (err) return next(err);
					if (!result) return next();
					require('../utils/renderTemplate')(templatePath, pageContext, { title: 'Title from model' }, function (err, html) {
						if (err) return next(err);
						res.set({
							'Content-Type': 'text/html'
						});
						res.send(html);
					});
				});
			});

			fileCallback();

		});

	}, callback);

};