
/**
 * Module dependencies.
 */

var db = require('./guess-db').Database;

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
        cookie: {maxAge: 60000*20}, // 20 mins
        secret: 'dontguessme!'
    }));
    app.use(app.router);
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

var db = new Database('localhost', 27017);

/* GET this site */
app.get('/', function(req, res, next){
    if( req.session.user ){
        res.redirect('/account');
    } else{
        res.redirect('/index');
    }
});

/* GET account page */
app.get('/account', function(req, res){
    if( !req.session.user ){
        res.redirect('/login');
    } else{
        db.getUser(req.session.user.userName, function(error, results){
            if( error ) callback(error);
            else{
                req.session.user = results;
                db.usersArray(function(error, results){
                    if( error ) console.log(error);
                    else{
                        res.render('account', {
                            title: 'Account - GuessMe!',
                            user: req.session.user,
                            usersArray: results,
                        });
                    }
                });
            }
        });
    }
});

app.get('/game-types', function(req, res){
    db.getGameTypes(function(error, types){
        if( error ) console.log(error);
        else{
            console.log(types);
            res.send(types);
        }
    });
});

app.get('/errlogin', function(req, res){
    res.render('errlogin', {
        title: 'Login Failed - GuessMe!'
    });
});

/* GET login page */
app.get('/login', function(req, res){
    res.render('login', {
        title: 'Login - GuessMe!'
    });
});

/* login user, create the session */
app.post('/authenticate', function(req, res){
    if( req.body.username === ''
    || req.body.password === '' ){
        console.log('fill all fields!');
        res.redirect('/errlogin');
    } else{
        db.login(req.body.username, req.body.password, function(error, results){
            if( error ){
                console.log(error);
                res.redirect('/errlogin');
            } else if( results ){
                console.log(results);
                req.session.user = results;
                res.redirect('/account');
            } else{
                console.log('problem logging in');
                res.redirect('/errlogin');
            }
        });
    }
});

/* db.save new user */
app.post('/newAcct', function(req, res){
    if( req.body.firstName === ''
    || req.body.lastName === ''
    || req.body.newUsername === ''
    || req.body.newPassword === '' ){
        console.log('Fill in all fields!');
        res.redirect('/errlogin');
        return;
    }
    var user = {
        userName: req.body.newUsername,
        password: req.body.newPassword,
        fName: req.body.firstName,
        lName: req.body.lastName
    };
    db.saveUser(user, function(error, results){
        if( error ){
            console.log(error);
            res.redirect('/errlogin');
        } else{
            db.login(user.userName, user.password, function(error, results){
                if( error ) console.log(error);
                console.log(results);
                req.session.user = results;
                res.redirect('/account');
            });
        }
    });
});

/* destroy the session */
app.post('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});

/* GET home page */
app.get('/index', function(req, res){
    res.render('index', { 
        title: 'Home - GuessMe!' 
    });
});

/* create new game, if exists, use that one */
app.post('/new-game', function(req, res){
    if( !req.session.user ){
        res.redirect('/login');
    } else if( req.body.opponent === ''){
        res.redirect('/account');
    } else if( req.body.opponent === req.session.user.userName ){
        res.redirect('/account');
    } else{ 
        // Double check that the opponent exists!
        db.getUser(req.body.opponent, function(error, results){
            if( error ){
                console.log('error, invalid opponent');
                res.redirect('/account');
            }
            else if( results ){
                console.log(req.body.options);
                /* first check if this game already exists */
                db.findGame(req.session.user.userName, req.body.opponent, req.body.options,
                function(error, results){
                    if( error ){
                        console.log(error);
                    }
                    if( results ){
                        if( results.player1.name === req.session.user.userName ){
                            req.session.opponent = results.player2.name;
                        } else{
                            req.session.opponent = results.player1.name;
                        }
                        req.session.game = results;
                        res.redirect('/game');
                    } else{
                        /* create a new game */
                        db.createGame(req.session.user.userName, req.body.opponent, req.body.options, 
                        function(error, results){
                            if( error ) console.log(error);
                            else{
                                db.findGame(req.session.user.userName, req.body.opponent, req.body.options,
                                function(error, results){
                                    if( error ) console.log(error);
                                    else{
                                        if( results.player1.name === req.session.user.userName ){
                                            req.session.opponent = results.player2.name;
                                        } else{ 
                                            req.session.opponent = results.player1.name;
                                        }   
                                        req.session.game = results;
                                        db.addGameToUser(results, req.session.user.userName, false, 
                                        function(error, results){
                                            if( error ) console.log(error);
                                            else{
                                                db.addGameToUser(req.session.game, req.session.opponent, true, 
                                                function(error, results){
                                                    if( error ) console.log(error);
                                                    else res.redirect('/game');
                                                }); // addGameToUser
                                            } // esle
                                        }); // addGameToUser
                                    } // esle
                                }); // findGame
                            } // esle
                        }); // createGame
                    } // esle
                }); // findGame
            } else{
                console.log('opponenet not found!');
                res.redirect('/account');
            } // esle
        }); // findUser
    } // esle
});

/* GET game page */
app.get('/game', function(req, res){
    if ( !req.session.user ){
        res.redirect('/login');
    } else{
        res.render('game', { 
            title: req.session.game.theme+' - GuessMe!',
            user: req.session.user,
            opponent: req.session.opponent
        });
    }
});

/* add a message to the game's chat, return the up-to-date */
app.post('/update-chat', function(req, res){
    if( !req.session.user ){
        res.redirect('/login');
    } else{
        /* if has message, push to db */
        if( req.body.message !== undefined ){
            var str ='<b>'+req.session.user.userName;
            str += ':</b> ';
            str += req.body.message;
            db.updateChatById(req.session.game._id, str,
            function(error, results){
                if( error ) console.log(error);
            });
        }
        /* return the up to date chat array */
        db.findChatById(req.session.game._id, function(error, results){
            if( error ){
                res.send('Game Over');
                res.redirect('/account');
            } else {
                res.send(results);
            }
        });
    }
});

/* update the game's guesses and board return up to date game */
app.post('/update-game', function(req, res){
    if( !req.session.user ){
        res.redirect('/login');
        return;
    }
    db.updateGameBoard(req.session.game._id, req.session.user.userName, req.body.board, 
    function(error, results){
        if( error ) console.log(error);
        else{
            if( req.body.guess ){
                var str = '<b>'+req.session.user.userName+':</b> '+req.body.guess;
                db.updateGameGuess(req.session.game._id, req.session.user.userName, str,
                function(error, results){
                    if( error ) console.log(error)
                    else{
                        if( req.body.isOppTurn ){
                            db.switchTurns(req.session.game._id, function(error, results){
                                if( error ) console.log(error);
                                else console.log('switched turns!');
                            });
                        }
                    }
                });
            }
            db.findGameById(req.session.game._id, function(error, results){
                if( error ){
                    res.send('Game Over');
                } else if( results ){
                    req.session.game = results;
                    results.user = req.session.user;
                    res.send(results);
                } else{
                    console.log('error, game not found');
                    res.redirect('/account');
                }
          });
        }
    });
});

app.post('/final-guess', function(req, res){
    var guess = req.body.finalGuess.toUpperCase();
    var winner, loser, sender, opponent, ans;
    if( req.session.game.player1.name === req.session.user.userName ){
        ans = req.session.game.player2.charName.toUpperCase();
        sender = req.session.game.player1.name;
        opponent = req.session.game.player2.name;
    } else{
        ans = req.session.game.player1.charName.toUpperCase();
        sender = req.session.game.player2.name;
        opponent = req.session.game.player1.name;
    }
    if( ans === guess ){
        winner = sender;
        loser = opponent;
        console.log('sender wins');
    } else{
        winner = opponent;
        loser = sender;
        console.log('opponent wins');
    }
    db.incrementUsersCred(winner, function(error, results){
        if( error ) console.log(error);
        else{
            db.decrementUsersCred(loser, function(error, results){
                if( error ) console.log(error);
                else{
                    db.endGameById(req.session.game, function(error, results){
                        if( error ) console.log(error);
                        else{
                            console.log(results);
                            res.send(winner);
                        }
                    });
                }
            });
        }
    });
});

/* the game boards characters and their name's */
app.get('/game-characters', function(req, res){
    db.getCharactersByType(req.session.game.theme, function(error, results){
        if( error ) console.log(error);
        else res.send(results);
    });
});

/* GET description page */
app.get('/description', function(req, res){
    res.render('description', {
        title: 'About - GuessMe!'
    })
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
