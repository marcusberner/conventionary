var path = require('path'),
	events = require('events');

module.exports = function (wrapWidget, randomString) {

	return function (widget, params, options, renderTemplate, context, callback) {

		if (!callback) {
			callback = context;
			context = {};
		}
		context.widgets = context.widgets || {};

		var cacheKey,
			shouldRender = false,
			eventEmitter,
			that = {},
			identifier = 'widget-' + randomString();

		cacheKey = JSON.stringify({
			type: widget.type,
			params: params,
			options: options
		});

		if (context.widgets[cacheKey] && context.widgets[cacheKey].error) {
			return callback(context.widgets[cacheKey].error);
		}

		if (context.widgets[cacheKey] && context.widgets[cacheKey].html) {
			if (context.widgets[cacheKey].html === '' && !context.widgets[cacheKey].renderOptions) return callback(null, '');
			callback(null, wrapWidget(widget, params, context.widgets[cacheKey].renderOptions, identifier, context.widgets[cacheKey].html));
		}

		if (!context.widgets[cacheKey]) {
			shouldRender = true;
			context.widgets[cacheKey] = {
				emitter: new events.EventEmitter()
			};
		}
		eventEmitter = context.widgets[cacheKey].emitter;

		eventEmitter.on('error', function (err) {
			context.widgets[cacheKey].error = err;
			callback(err);
		});
		eventEmitter.on('rendered', function (html, renderOptions) {
			context.widgets[cacheKey].html = html;
			context.widgets[cacheKey].renderOptions = renderOptions;
			if (html === '' && !renderOptions) return callback(null, '');
			callback(null, wrapWidget(widget, params, renderOptions, identifier, html));
		});

		if (!shouldRender) return;

		widget.test.bind(that)(params, function (err, result) {
			if (err) return eventEmitter.emit('error', err);
			if (!result) return eventEmitter.emit('rendered', '');
			widget.factory.bind(that)(params, function (err, widgetModel, factoryOptions) {
				if (err) return eventEmitter.emit('error', err);
				factoryOptions = factoryOptions || {};
				var templatePath,
					renderOptions = mergeOptions([options, factoryOptions, widget.options]);
				if (factoryOptions.template) {
					templatePath = path.join(widget.dir, factoryOptions.template);
				} else {
					templatePath = widget.template;
				}
				if (typeof(widgetModel) === 'string') {
					eventEmitter.emit('rendered', widgetModel, renderOptions);
				} else {
					renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
						if (err) return eventEmitter.emit('error', err);
						eventEmitter.emit('rendered', widgetHtml, renderOptions);
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
