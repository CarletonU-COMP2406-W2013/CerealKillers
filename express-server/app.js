
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
    //setupMovieChars();
    if( req.session.isAuthenticated ){
        res.redirect('/account');
    } else{
        res.redirect('/index');
    }
});

app.get('/account', function(req, res){
    if( !req.session.isAuthenticated ){
        res.redirect('/login');
    }
    db.usersArray(function(error, results){
        if( error ){
            console.log(error);
        } else{
            res.render('account', {
                title: 'My Account',
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
        } else if( results ){
            console.log(results);
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
        userName: req.body.newUsername,
        password: req.body.newPassword,
        fName: req.body.firstName,
        lName: req.body.lastName
    };
    db.saveUser(user, function(error, results){
        if( error ){
            console.log(error);
        } else{
            req.session.username = req.body.newUsername;
            req.session.password = req.body.newPassword;
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

app.post('/new-game', function(req, res){
    if( !req.session.isAuthenticated ){
        res.redirect('/login');
    } else if( req.body.opponent === ''){
        console.log('no opp');//res.end();
    } else if( req.body.opponent === req.session.username ){
        console.log('opponent is user');//res.end()
    } else{ 
        // Double check that the opponent exists!
        db.containsUser(req.body.opponent, function(error, results){
            if( error ) console.log('error');//res.end();
            else if( results ){
                db.createGame(req.session.username, req.body.opponent, 'Movie Characters', 
                        function(error, results){
                    if( error ) console.log('error2');
                    else if( results ){
                        console.log(results);
                        req.session.opponent = req.body.opponent;
                        req.session.game = results;
                        res.redirect('/game');
                    }
                });
            } else{
                console.log('else');// res.end();
            }
        });
    }
});

app.post('/join-game', function(req, res){
});

app.get('/game', function(req, res){
    if ( !req.session.isAuthenticated ){
        res.redirect('/login');
    } else{
        res.render('game', { 
            title: 'New Game',
            user: req.session.username,
            opponent: req.session.opponent
        });
    }
});

app.post('/update-chat', function(req, res){
    var str = req.session.username;
    str += ': ';
    str += req.body.message;
    console.log(str);
    db.updateChatById(req.session.gameID, str, 
    function(error, results){
        if( error ) console.log(error);
        else{
            res.send(results);
        }
    });
});

app.get('/get-chat', function(req, res){
    db.findChatById(req.session.gameID, function(error, results){
        if( error ) callback(error);
        else{
            console.log(results);
            res.send(results);
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
        if( error ) console.log(error);
        else res.send(results);
    });
});

app.get('/description', function(req, res){
    res.render('description', {
        title: 'About GuessMe!'
    })
});

var setupMovieChars = function(){
    /* The array of image paths */
    var imgArr = new Array(4);
    for( var i=0; i<4; i++ ){
        imgArr[i] = new Array(6);
    }
    /* Row 0 */
    imgArr[0][0] = 'images/MovieCharacters/America.jpg';
    imgArr[0][1] = 'images/MovieCharacters/Bane.jpg';
    imgArr[0][2] = 'images/MovieCharacters/Batman.jpg';
    imgArr[0][3] = 'images/MovieCharacters/BlackWidow.jpg';
    imgArr[0][4] = 'images/MovieCharacters/Bond.jpg';
    imgArr[0][5] = 'images/MovieCharacters/Catwoman.jpg';
    /* Row 1 */
    imgArr[1][0] = 'images/MovieCharacters/Dexter.jpg';
    imgArr[1][1] = 'images/MovieCharacters/Fast-and-Furious.jpg';
    imgArr[1][2] = 'images/MovieCharacters/Hulk.jpg';
    imgArr[1][3] = 'images/MovieCharacters/Humantorch.JPG';
    imgArr[1][4] = 'images/MovieCharacters/Ironman.jpg';
    imgArr[1][5] = 'images/MovieCharacters/Joker.jpg';
    /* Row 2 */
    imgArr[2][0] = 'images/MovieCharacters/Maul.jpg';
    imgArr[2][1] = 'images/MovieCharacters/McClane.jpg';
    imgArr[2][2] = 'images/MovieCharacters/Rambo.jpg';
    imgArr[2][3] = 'images/MovieCharacters/Skywalker.jpg';
    imgArr[2][4] = 'images/MovieCharacters/Spiderman.jpg';
    imgArr[2][5] = 'images/MovieCharacters/Superman.jpg';
    /* Row 3 */
    imgArr[3][0] = 'images/MovieCharacters/Terminator.jpg';
    imgArr[3][1] = 'images/MovieCharacters/Thor.jpg';
    imgArr[3][2] = 'images/MovieCharacters/Tomb-Raider.jpg';
    imgArr[3][3] = 'images/MovieCharacters/Vader.jpg';
    imgArr[3][4] = 'images/MovieCharacters/Wolverine.jpg';
    imgArr[3][5] = 'images/MovieCharacters/Loki.png';

    /* The array of character names corresponding to each image. */
    var nameArr = new Array(4);
    for( var i=0; i<4; i++ ){
        nameArr[i] = new Array(6);
    }
    /* Row 0 */
    nameArr[0][0] = 'Captain America';
    nameArr[0][1] = 'Bane';
    nameArr[0][2] = 'Batman';
    nameArr[0][3] = 'Black Widow';
    nameArr[0][4] = 'James Bond';
    nameArr[0][5] = 'Catwoman';
    /* Row 1 */
    nameArr[1][0] = 'Dexter';
    nameArr[1][1] = 'Dominic Toretto';
    nameArr[1][2] = 'The Hulk';
    nameArr[1][3] = 'The Human Torch';
    nameArr[1][4] = 'Ironman';
    nameArr[1][5] = 'The Joker';
    /* Row 2 */
    nameArr[2][0] = 'Darth Maul';
    nameArr[2][1] = 'John McClane';
    nameArr[2][2] = 'Rambo';
    nameArr[2][3] = 'Luke Skywalker';
    nameArr[2][4] = 'Spiderman';
    nameArr[2][5] = 'Superman';
    /* Row 3 */
    nameArr[3][0] = 'The Terminator';
    nameArr[3][1] = 'Thor';
    nameArr[3][2] = 'Tomb Raider';
    nameArr[3][3] = 'Darth Vader';
    nameArr[3][4] = 'Wolverine';
    nameArr[3][5] = 'Loki';

    /* Save the Arrays to db.charactersCollection */
    db.saveCharacterSetByType('Movie Characters', imgArr, nameArr, function(error, results){
        if( error ){
            console.log(error);
        } else{
            console.log(results);
        }
    });
}; 

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
