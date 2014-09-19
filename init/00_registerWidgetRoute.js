
module.exports = function (app, widgets, renderTemplate, randomString, wrapWidget) {

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
					var params = (body === '') ? {} : JSON.parse(body),
						wrap = widget.wrap,
						identifier = 'widget-' + randomString(),
						that = {};
					if (req.query.wrap === 'true') wrap = true;
					else if (req.query.wrap === 'false') wrap = false;
					widget.test.bind(that)(params, function (err, result) {
						if (err) return next(err);
						if (!result) return next();
						widget.factory.bind(that)(params, function (err, widgetModel, options) {
							if (err) return next(err);
							options = options || {};
							var templatePath = widget.template;
							if (options.template) templatePath = path.join(widget.dir, options.template);
							renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
								if (err) return next(err);
								res.send(wrap ? wrapWidget(widget, identifier, widgetHtml) : widgetHtml);
							});
						});
					});
				} catch (e) {
					return next(e);
				}
			});
		});

		callback();
	}

};
