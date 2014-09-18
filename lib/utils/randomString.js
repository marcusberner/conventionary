module.exports = function () {

	return function() {
		return (new Date()).getTime().toString() + Math.round((Math.random() * 1000000));
	}

};