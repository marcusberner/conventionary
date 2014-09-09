module.exports = function (options) {

	return function (text) {
		for (var i = options.dictionaries.length - 1; i >= 0; i--) {
			if (options.dictionaries[i][text]) return options.dictionaries[i][text];
		}
		return text;
	};

};
