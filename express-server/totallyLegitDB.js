function login(req, username){
    //adding members to req.session automatically associates them with the session in the datastore (client never sees this info)
    req.session.username = username;
}

function logout(req){
    //manually delete this session
    req.session.destroy(function(err){
        if(err){
            console.log("Error: %s", err);
        }
    });
}

function isAuthenticated(req, res, next){
    //if there's a username associated with this session, continue the request
    if(req.session.username){
        return next();
    }else{
        //Otherwise, redirect
        res.redirect("/?error=Not Logged In");
    } 
}

function loginList(req, res, next){
    return req.session.find();
}

exports.login = login;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
