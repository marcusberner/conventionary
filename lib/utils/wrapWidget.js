module.exports = function () {

	return function (widget, identifier, content) {

		var output = ('<div id="' + identifier + '" class="' + widget.cssClass + '" data-widget-type="' + widget.type + '">\n');
		output += content;
		output += ('\n</div>');

		return output;

	}

};