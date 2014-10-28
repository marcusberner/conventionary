module.exports = function () {

	return function (widget, params, options, identifier, content) {

		if (options.wrap === false || options.wrap === 'false') return content;
		options.attributes = options.attributes || {};
		options.attributes.id = identifier;
		options.attributes.class = options.attributes.class || '';
		options.attributes.class += (' ' + widget.cssClass);


		var output = '<div';
		for (var attr in options.attributes) {
			output += (' ' + attr + '="' + options.attributes[attr] + '"');
		}
		output += '>\n';
		output += content;

		if (options.exposeParams) {
			output += ('\n<script id="' + identifier + '-params" type="application/json">\n');
			output += JSON.stringify(params);
			output += ('\n</script>');
		}
		output += ('\n</div>');

		return output;

	}

};