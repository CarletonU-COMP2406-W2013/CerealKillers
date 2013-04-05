
/**
 * Module dependencies.
 */

var db = require('./mongodb').Database;

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/account')
  , game = require('./routes/game')
  , index = require('./routes/index')
  , description = require('./routes/description')
  , http = require('http')
  , path = require('path');

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

var db = new Database('localhost', 27017);


app.get('/', function(req, res, next){
    // if logged in, account, else /index
    res.redirect("/index");
});

app.get('/account', function(req, res){
    db.userListing(function (results){
        res.render("account", {
            title: 'Your Account',
            username: 'User',
            users: JSON.stringify(results)
        });
    });
});

app.post("/login", function(req,res){
    // db.login(req.username);
    //res.redirect("/account");
});

app.post("/logout", function(req,res){
    // logout database
    res.redirect("/");
});

app.get('/index', function(req, res){
    res.render('index', { 
        title: 'Welcome to GuessMe!' 
    })
});

app.get('/game', function(req, res){
    db.createGame("Kurt123", "branS2233", "Super-heroes", function(results, error){
        if( error ){
            console.log(error);
        }else{
            console.log(results);
            res.render('game', { 
                title: 'New Game',
                gameID: results,
                user: 'Kurt123',
                opponent: 'branS2233'
            });
        }
    });
});
app.post('/update-game', function(req, res){
    console.log("got");
    res.send("whats up?");

});
app.get('/game-state', function(req, res){
    // server state!
});

app.get('/description', function(req, res){
    res.render('description', {
        title: 'About GuessMe!'
    })
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
