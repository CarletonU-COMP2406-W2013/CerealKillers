
/**
 * GET users listing.
 */

exports.list = function(req, res){
  res.render("account.jade",{username:req.session.username, title:"Account", users:list});
};
