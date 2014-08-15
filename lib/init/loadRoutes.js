
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

			var test = route.test ? route.test : function (pageContext, callback) { callback(null, true);},
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

	});

};