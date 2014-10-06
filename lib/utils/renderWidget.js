var path = require('path');

module.exports = function (wrapWidget, randomString) {

	return function (widget, params, options, renderTemplate, widgetCache, callback) {

		if (!callback) {
			callback = widgetCache;
			widgetCache = {};
		}

		var that = {},
			identifier = 'widget-' + randomString();

		widget.test.bind(that)(params, function (err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, '');
			widget.factory.bind(that)(params, function (err, widgetModel, factoryOptions) {
				if (err) return callback(err);
				factoryOptions = factoryOptions || {};
				var templatePath,
					renderOptions = mergeOptions([options, factoryOptions, widget.options]);
				if (factoryOptions.template) {
					templatePath = path.join(widget.dir, factoryOptions.template);
				} else {
					templatePath = widget.template;
				}
				if (typeof(widgetModel) === 'string') {
					callback(null, wrapWidget(widget, params, renderOptions, identifier, widgetModel));
				} else {
					renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
						if (err) return callback(err);
						callback(null, wrapWidget(widget, params, renderOptions, identifier, widgetHtml));
					});
				}
			});
		});

	}
};

function mergeOptions (optionsToMerge) {
	var result = {};
	optionsToMerge.forEach(function(options) {
		if (!options) return;
		for (var key in options) {
			if (!result.hasOwnProperty(key) && options.hasOwnProperty(key)) {
				result[key] = options[key];
			}
		}
	});
	return result;
}
