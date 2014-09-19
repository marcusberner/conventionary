module.exports = function () {

	return function (widget, params, identifier, content) {

		var output = ('<div id="' + identifier + '" class="' + widget.cssClass + '" data-widget-type="' + widget.type + '">\n');
		output += content;
		if (widget.exposeParams) {
			output += ('\n<script id="' + identifier + '-params" type="application/json">\n');
			output += JSON.stringify(params);
			output += ('\n</script>');
		}
		output += ('\n</div>');

		return output;

	}

};