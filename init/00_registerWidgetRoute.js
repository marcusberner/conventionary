
module.exports = function (app, widgets, renderTemplate, randomString, renderWidget) {

	return function(callback) {

		app.post('/widgets.*', function(req, res, next){

			var widget = widgets.filter(function (widget) {
				return widget.type === req.params['0'];
			})[0];

			if (!widget) return next();

			var body = '';
			req.on('data', function(data) {
				body += data;
			});
			req.on('end', function() {
				try {
					var params = (body === '') ? {} : JSON.parse(body);
					renderWidget(widget, params, req.query, renderTemplate, function (err, html) {
						if (err) return next(err);
						res.send(html);
					});
				} catch (e) {
					return next(e);
				}
			});
		});

		callback();
	}

};
