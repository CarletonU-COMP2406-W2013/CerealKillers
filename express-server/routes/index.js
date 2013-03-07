
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', { title: 'GuessMe!', error: req.query.error });
}
