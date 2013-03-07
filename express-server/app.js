
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , game = require('./routes/game')
  , http = require('http')
  , path = require('path')
  , db = require("./totallyLegitDB");

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat'}));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res, next){
    if(req.session.username){
        res.redirect("/users");
    }else{
        routes.index(req, res, next);
    }
});
app.get('/users', db.isAuthenticated, user.list);
app.post("/login", function(req,res){
    db.login(req, req.body.username);
    res.redirect("/users");
});

app.post("/logout", function(req,res){
    db.logout(req);
    res.redirect("/");
});

app.get('/game', function (req, res){
    res.render('game',
    { title: 'New Game' }
    )
});

app.post("/game", function(req, res){
    res.render('game',
    { title: 'New Game' }
    )
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


