var path = require('path');

module.exports = function (wrapWidget, randomString) {

	return function (widget, params, renderTemplate, options, callback) {

		var that = {},
			wrap = options.hasOwnProperty('wrap') ? options.wrap : widget.wrap,
			identifier = 'widget-' + randomString();

		widget.test.bind(that)(params, function (err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, '');
			widget.factory.bind(that)(params, function (err, widgetModel, widgetOptions) {
				if (err) return callback(err);
				widgetOptions = widgetOptions || {};
				var templatePath = widget.template;
				if (widgetOptions.template) templatePath = path.join(widget.dir, widgetOptions.template);
				renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
					if (err) return callback(err);
					callback(null, wrap ? wrapWidget(widget, identifier, widgetHtml) : widgetHtml);
				});
			});
		});

	}
};
