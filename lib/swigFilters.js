module.exports = function(swig, options) {

	swig.setFilter('cacheBust', function (url) {
		var busted = url + (url.indexOf('?') >= 0 ? '&' : '?');
		busted += 'v=' + options.version;
		return busted;
	});

};
