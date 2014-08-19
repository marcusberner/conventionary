var swig = require('swig'),
	_dictionaries;

module.exports = function(dictionaries) {
	_dictionaries = dictionaries;
	swig.setFilter('translate', function (text) {
		for (var i = _dictionaries.length - 1; i >= 0; i--) {
			if (_dictionaries[i][text]) return _dictionaries[i][text];
		}
		return text;
	});

};