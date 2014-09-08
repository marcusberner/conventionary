
var fs = require('fs'),
	path = require('path');

module.exports = function (app, options, addWidgetRenderers, renderTemplate) {

	return function (callback) {


		var templatePath = path.join(options.routePath, '404.html');
		if (!fs.existsSync(templatePath)) return callback();
		app.get('/*', function (req, res, next) {
			var internalRequestContext = {},
				requestContext = {
					request: req
				};
			addWidgetRenderers(internalRequestContext, requestContext);
			renderTemplate(templatePath, internalRequestContext, null, function (err, html) {
				if (err) return next(err);
				res.status(404);
				res.set({
					'Content-Type': 'text/html'
				});
				res.send(html);
			});
		});



	};

};
