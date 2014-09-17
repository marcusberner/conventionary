var path = require('path');

module.exports = function (widgets, renderTemplate) {

	return function (internalRequestContext, requestContext) {

		if (!internalRequestContext.hasOwnProperty('widgetIterator')) internalRequestContext.widgetIterator = 0;
		internalRequestContext.widgetRenderers = internalRequestContext.widgetRenderers || [];
		internalRequestContext.widgetRendererFactories = {};

		widgets
			.sort(function (a, b) {
				return a.path.length - b.path.length;
			})
			.forEach(function (widget) {
				var nameSpace = internalRequestContext.widgetRendererFactories,
					name = widget.path[widget.path.length - 1];
				for (var i = 0; i < widget.path.length - 1; i++) {
					nameSpace[widget.path[i]] = nameSpace[widget.path[i]] || {};
					nameSpace = nameSpace[widget.path[i]];
				}
				nameSpace[name] = function (data) {
					var identifier = 'widget-' + widget.path.join('_') + '-' + ++internalRequestContext.widgetIterator,
						output = '',
						placeHolder = '<!-' + identifier + '->';

					if (widget.wrap) output += ('<div id="' + identifier + '" class="' + identifier.replace(/-\d+$/, '') + '" data-widget-type="' + widget.path.join('.') + '">\n');
					output += placeHolder;
					if (widget.wrap) output += ('\n</div>');

					internalRequestContext.widgetRenderers.push(function (widgetRenderedCallback) {
						var that = {};
						widget.test.bind(that)(requestContext, data, function (err, result) {
							if (err) return widgetRenderedCallback(err);
							if (!result) return widgetRenderedCallback(null, {
								placeHolder: output,
								html: ''
							});
							widget.factory.bind(that)(requestContext, data, function (err, widgetModel, options) {
								if (err) return widgetRenderedCallback(err);
								options = options || {};
								var templatePath = widget.template;
								if (options.template) templatePath = path.join(widget.dir, options.template);
								renderTemplate(templatePath, internalRequestContext, widgetModel, function (err, widgetHtml) {
									if (err) return widgetRenderedCallback(err);
									widgetRenderedCallback(null, {
										placeHolder: placeHolder,
										html: widgetHtml
									});
								});
							});
						});
					});

					return output;
				};
			});
	};

};
