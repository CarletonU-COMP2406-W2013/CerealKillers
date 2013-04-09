
/**
 * Module dependencies.
 */

var db = require('./mongodb').Database;

var express = require('express')
  , routes = require('./routes')
  , account = require('./routes/account')
  , game = require('./routes/game')
  , index = require('./routes/index')
  , login = require('./routes/login')
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
  app.use(require('connect').bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ 
      cookie: {maxAge: 60000*20},
      secret: 'dontguessme'
      }));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var db = new Database('localhost', 27017);


app.get('/', function(req, res, next){
    if( req.session.isAuthenticated ){
        res.redirect('/account');
    } else{
        res.redirect('/index');
    }
});

app.get('/account', function(req, res){
    if(! req.session.isAuthenticated ){
        res.redirect('/login');
    }
    db.userListing(function (error, results){
        if( error ){
            console.log(error);
        } else{
            var json = JSON.stringify(results);
            var users = JSON.parse(json);
            res.render("account", {
                title: 'Account',
                username: req.session.username,
                users: results
            });
        }
    });
});

app.get('/login', function(req, res){
    res.render('login', {
        title: 'Login'
    });
});

app.post('/authenticate', function(req, res){
    if( req.body.username === ''
            || req.body.password === '' ){
        console.log('fill all fields!');
        return;
    }
    db.login(req.body.username, req.body.password, function(error, results){
        if( error ){
            console.log(error);
        } else if( results === true ){
            req.session.isAuthenticated = true;
            req.session.username = req.body.username;
            req.session.password = req.body.password;
            res.redirect('/account');
        } else{
            console.log('problem logging in');
        }
    });
});

app.post('/newAcct', function(req, res){
    if( req.body.firstName === ''
            || req.body.lastName === ''
            || req.body.newUsername === ''
            || req.body.newPassword === '' ){
        console.log('Fill in all fields!');
        res.end('error');
        return;
    }
    var user = {
        userName: req.newUsername,
        password: req.newPassword,
        fName: req.newFirstName,
        lName: req.newLastName
    };
    db.saveUser(user, function(error, results){
        if( error ){
            console.log(error);
        } else{
            req.session.username = req.newUsername;
            req.session.password = req.newPassword;
            req.session.isAuthenticated = true;
            res.redirect('/account');
        }
    });
});

app.post('/logout', function(req, res){
    db.logout(req.session.username, function(error){
        if( error ){
            console.log(error);
        }
        req.session.destroy();
        res.redirect('/');
    });
});

app.get('/index', function(req, res){
    res.render('index', { 
        title: 'Welcome to GuessMe!' 
    });
});

app.get('/game', function(req, res){
    if(! req.session.isAuthenticated ){
        res.redirect('/login');
    }
    db.createGame("Kurt123", "branS2233", "Super-heroes", function(results, error){
        if( error ){
            console.log(error);
        } else{
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
});

app.get('/game-state', function(req, res){
    // server state!
});

app.get('/game-characters', function(req, res){
    db.getCharactersByType('Movie Characters', function(error, results){
        if( error )  console.log(error);
        else res.send(results);
    });
});

app.get('/description', function(req, res){
    res.render('description', {
        title: 'About GuessMe!'
    })
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
