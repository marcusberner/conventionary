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

		if (context.widgets[cacheKey] && context.widgets[cacheKey].rendered) {
			if (context.widgets[cacheKey].error) return callback(context.widgets[cacheKey].error);
			if (context.widgets[cacheKey].html === '' && !context.widgets[cacheKey].renderOptions) return callback(null, '');
			return callback(null, wrapWidget(widget, params, context.widgets[cacheKey].renderOptions, identifier, context.widgets[cacheKey].html));
		}

		if (!context.widgets[cacheKey]) {
			shouldRender = true;
			context.widgets[cacheKey] = {
				rendered: false,
				emitter: new events.EventEmitter()
			};
			context.widgets[cacheKey].emitter.setMaxListeners(0);
		}
		eventEmitter = context.widgets[cacheKey].emitter;

		eventEmitter.once('done', function (err, html, renderOptions) {
			context.widgets[cacheKey].rendered = true;
			context.widgets[cacheKey].emitter = null;
			if (err) {
				context.widgets[cacheKey].error = err;
				return callback(err);
			}
			context.widgets[cacheKey].html = html;
			context.widgets[cacheKey].renderOptions = renderOptions;
			if (html === '' && !renderOptions) return callback(null, '');
			callback(null, wrapWidget(widget, params, renderOptions, identifier, html));
		});

		if (!shouldRender) return;

		widget.test.bind(that)(params, function (err, result) {
			if (err) return eventEmitter.emit('done', err);
			if (!result) return eventEmitter.emit('done', null, '');
			widget.factory.bind(that)(params, function (err, widgetModel, factoryOptions) {
				if (err) return eventEmitter.emit('done', err);
				factoryOptions = factoryOptions || {};
				var templatePath,
					renderOptions = mergeOptions([options, factoryOptions, widget.options]);
				if (factoryOptions.template) {
					templatePath = path.join(widget.dir, factoryOptions.template);
				} else {
					templatePath = widget.template;
				}
				if (typeof(widgetModel) === 'string') {
					eventEmitter.emit('done', null, widgetModel, renderOptions);
				} else {
					renderTemplate(templatePath, widgetModel, function (err, widgetHtml) {
						if (err) return eventEmitter.emit('done', err);
						eventEmitter.emit('done', null, widgetHtml, renderOptions);
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
