module.exports = function () {

	return function() {
		return Math.round((Math.random() * 1000000000000)).toString();
	}

};