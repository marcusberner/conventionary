module.exports = function () {

	return function (widget, params, options, identifier, content) {

		if (options.wrap === false || options.wrap === 'false') return content;

		var output = ('<div id="' + identifier + '" class="' + widget.cssClass + '" data-widget-type="' + widget.type + '">\n');
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