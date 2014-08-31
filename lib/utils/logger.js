module.exports = function (siteSandal, done) {


	if (siteSandal.has('logger')) {
		return siteSandal.resolve(function(err, logger) {
			done(err, logger);
		});
	} else {
		done(null, console);
	}

};