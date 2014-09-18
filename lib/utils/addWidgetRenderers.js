var path = require('path');

module.exports = function (widgets, randomString, renderTemplate) {

	return function (requestContext) {

		if (!requestContext.hasOwnProperty('widgetIterator')) requestContext.widgetIterator = 0;
		requestContext.widgetRenderers = requestContext.widgetRenderers || [];
		requestContext.widgetRendererFactories = {};

		widgets
			.sort(function (a, b) {
				return a.path.length - b.path.length;
			})
			.forEach(function (widget) {
				var nameSpace = requestContext.widgetRendererFactories,
					name = widget.path[widget.path.length - 1];
				for (var i = 0; i < widget.path.length - 1; i++) {
					nameSpace[widget.path[i]] = nameSpace[widget.path[i]] || {};
					nameSpace = nameSpace[widget.path[i]];
				}
				nameSpace[name] = function (data) {
					var identifier = 'widget-' + randomString(),
						cssClass = 'widget-' + widget.path.join('_'),
						output = '',
						placeHolder = '<!-' + identifier + '->';

					if (widget.wrap) output += ('<div id="' + identifier + '" class="' + cssClass + '" data-widget-type="' + widget.path.join('.') + '">\n');
					output += placeHolder;
					if (widget.wrap) output += ('\n</div>');

					requestContext.widgetRenderers.push(function (widgetRenderedCallback) {
						var that = {};
						widget.test.bind(that)(data, function (err, result) {
							if (err) return widgetRenderedCallback(err);
							if (!result) return widgetRenderedCallback(null, {
								placeHolder: output,
								html: ''
							});
							widget.factory.bind(that)(data, function (err, widgetModel, options) {
								if (err) return widgetRenderedCallback(err);
								options = options || {};
								var templatePath = widget.template;
								if (options.template) templatePath = path.join(widget.dir, options.template);
								renderTemplate(templatePath, requestContext, widgetModel, function (err, widgetHtml) {
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
