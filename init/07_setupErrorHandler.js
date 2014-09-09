
var fs = require('fs'),
	path = require('path');

module.exports = function (app, options, addWidgetRenderers, renderTemplate) {

	return function (callback) {

		var templatePath = path.join(options.routePath, '500.html');
		if (!fs.existsSync(templatePath)) return callback();

		app.use(function(err, req, res, next){

			var internalRequestContext = {},
				requestContext = {
					request: req
				},
				displayErrorMessage = options.displayErrorMessage;
			addWidgetRenderers(internalRequestContext, requestContext);
			renderTemplate(templatePath, internalRequestContext, { error: (displayErrorMessage ? err.message : '') }, function (err, html) {

				if (err) {
					var message = 'Internal server error';
					if (displayErrorMessage) message += ('\n' + err.message);
					res.status(500);
					res.set({
						'Content-Type': 'text/plain'
					});
					res.send(message);
					return;
				}

				res.status(500);
				res.set({
					'Content-Type': 'text/html'
				});
				res.send(html);
			});

		});

		callback();

	};

};
