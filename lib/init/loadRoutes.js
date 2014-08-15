
var fs = require('fs'),
	path = require('path');

module.exports = function (app) {

	var routesDir = path.join(process.cwd(), '/routes');
	if (!fs.existsSync(routesDir) || !fs.statSync(routesDir).isDirectory()) return;

	fs.readdirSync(routesDir).forEach(function (file) {

		var routeDir = path.join(routesDir, file),
			routePath = path.join(routeDir, file + '.js'),
			templatePath = path.join(routeDir, file + '.html'),
			route;

		if (!fs.existsSync(routePath) || !fs.statSync(routePath).isFile()) return;

		route = require(routePath);

		if (route.handler) {
			app.get(route.path, route.handler);
			return;
		}

		app.get(route.path, function(req, res, next){

			require('../utils/renderTemplate')(templatePath, {}, { title: 'Title from model' }, function (err, html) {

				if (err) return next(err);
				res.set({
					'Content-Type': 'text/html'
				});
				res.send(html);

			});


		});

	});

};