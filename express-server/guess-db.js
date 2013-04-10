var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

/* keep track of active games */
var currId = 0;

/**
 * Database object
 */
Database = function(host, port){
  this.db= new Db('guess-mongo', new Server(host, port, {safe:true}, {auto_reconnect:true}));
  this.db.open(function(){});
};



/**
 * Game functions
 */
Database.prototype.getGames = function(callback){
    this.db.collection('games', function(error, game_collection){
        if( error ) callback(error);
        else callback(null, game_collection);
    });
};

/* form a game between two users */
Database.prototype.createGame = function(name1, name2, type, callback){
    /* if a game already exists between these users, return it */
    var that = this;
    this.findGame(name1, name2, function(error, results){
        if( results ) callback(results);
    });
    this.getGames(function(error, game_collection){
        game_collection.findOne({ gameID: 1 }, function(error, results){
            if( results )callback(1);
        });
        if( error ) callback(error);
        else {
            /* create two game boards as 2D arrays */
            var b1 = new Array(6);
            var b2 = new Array(6);

            for( var i=0; i<4; i++ ){
                b1[i] = new Array(4);
                b2[i] = new Array(4);

                /* all positions are true; all characters are shown */
                for( var j=0; j<6; j++ ){
                    b1[i][j] = true;
                    b2[i][j] = true;
                }
            }
            /* choose a random card for each player */
            var x1 = Math.floor((Math.random()*4));
            var y1 = Math.floor((Math.random()*6));
            var x2 = Math.floor((Math.random()*4));
            var y2 = Math.floor((Math.random()*6));
            var p1 = '['+x1+', '+y1+']';
            var p2 = '['+x2+', '+y2+']';
            /* create the user objects */
            var user1 = {
                name:  name1,
                board: b1,
                character: p1,
                isTurn: true
            };
            var user2 = {
                name: name2,
                board: b2,
                character: p2,
                isTurn: false
            };
            currId++; // increment id
            game_collection.save({ gameType: type, player1: user1, player2: user2,
                guesses: [], chat: [] });
            /* return the name game instance (double check finding it) */
            that.findGame(user1.name, user2.name, function(error, results){
                if( error ) callback(error);
                else{
                    that.addGameToUser(results._id, user1.name, function(callback){
                        
                    });
                    callback(null, results);
                }            
            });
        }
    });
};

/* find a game instance that contains the two names */
/* useful to check if game exists */
Database.prototype.findGame = function(name1, name2, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ 'player1.name': name1, 'player2.name': name2 },
                    function(error, results){
                if( error || !results ){ 
                    game_collection.findOne({ 'player1.name': name2, 'player2.name': name1 },
                            function(error, results){
                        if( error || !results ) callback(error);
                        else callback(null, results);
                    });
                }
                else callback(null, results);
            });
        }
    });
};

Database.prototype.findUsersGame = function(name, callback){
    this.getGame(function(error, game_cllection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ 'player1.name': name },
                    function(error, results){
                if( error ){ 
                    game_collection.findOne({ 'player2.name': name },
                            function(error, results){
                        if( error ) callback(error);
                        else callback(null, results);
                    });
                }
                else callback(null, results);
            });
        }
    });
};

Database.prototype.updateGame = function(id, name, board, guess, isOppTurn, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            // update the guess array
            game_collection.update({ gameID: id }, { '$push': { 'guesses': guess } });
            // get the user object matching username
            var user1, user2;
            user1 = game_collection.find({ gameID: id }, { player1: 1, _id: 0 });
            user2 = game_collection.find({ gameID: id }, { player2: 1, _id: 0 });
            if( !(user1 && user2) ) callback('error, users not found');
            /* update user's board */
            else{
                if( user1.name === name ){
                    user1.board = board;
                    if( isOppTurn ){ 
                        user1.isTurn = false;
                        user2.isTurn = true;
                    }
                }
                else if( user2.name === name ){
                    user2.board = board;
                    if( isOppTurn ){
                        user1.isTurn = true;
                        user2.isTurn = false;
                    }
                } else (callback('error with users'));
                game_collection.update({ gameID: id }, { '$set': { player1: user1 } });
                game_collection.update({ gameID: id }, { '$set': { player2: user2 } });
                findGameById(id, callback); //all was successful, return this game
            }
        }
    });
};

/* update game's chat feed */
Database.prototype.updateChatById = function(id, string, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.update({ gameID: id }, { '$push': { 'chat': string } });
            callback(null, 'success');
        }
    });
};

/* get game's chat feed */
Database.prototype.findChatById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ gameID: id }, function(error, results){
                if( error ) callback(error);
                else{
                    callback(null, results.chat);
                }
            });
        }
    });
};

/* return entire game instance */
Database.prototype.findGameById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else {
            game_collection.findOne({ gameID: id }, function(error, result){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};

/* end a game */
Database.prototype.endGameById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else {
            game_collection.remove({ gameID: id }, function(error){
                if( error ) callback(error);
                else{
                    currId--;
                    callback(null);
                }
            });
        }
    });
};



/**
 * User functions
            addGameToUser(currId, name1, function(error, results){
                if( error ) callback(error);
            });
 */
Database.prototype.getUsers = function(callback){
    this.db.collection('users', function(error, user_collection){
        if( error ) callback(error);
        else callback(null, user_collection);
    });
};

Database.prototype.saveUser = function(user, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else {
            user_collection.save({ userName: user.userName, fName: user.fName, lName: user.lName,
                password: user.password, gameIDs: [], gameCred: 0 });
            callback(null, 'success');
        }
    });
};

/* erase a user from db */
Database.prototype.removeUserByName = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            /* deleting user, must delete their games too */
            this.getGames(function(error, game_collection){
                if( error ) callback(error);
                else{
                    /* loop array of gameIDs and delete these games */
                    var arr = user_collection.find({ userName: name }, { gameIDs: 1, _id: 0 });
                    for( var i=0; i<arr.size; i++ ){
                        game_collection.remove({ gameID: arr[i] });
                    }
                }
            });
            user_collection.remove({ userName: name });
            callback(null, 'success');
        }
    });
};

/* return array of all signed up users */
Database.prototype.usersArray = function(callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.find().toArray(function(error, results){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};

Database.prototype.login = function(name, pass, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name, password: pass }, function(error, results){
                if( error ) callback(error);
                //else if( results.userName !== name ) callback('error');
                else callback(null, results);
            });
        }
    });
};

Database.prototype.containsUser = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name }, function(error, results){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};

Database.prototype.logout = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            callback(null, 'success');
       }
    });
};

Database.prototype.addGameToUser = function(id, name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.update({ userName: name }, {'$push': { gameIDs: id } })
            callback(null, 'success');
        }
    });
};

/* returns an array of game ids. Can get games using these. */
Database.prototype.getUsersGameIDs = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.find({ userName: name,  online: 'yes' }, { gameIDs: 1, _id: 0 },
                    function(error, results){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};



/**
 * Save game types as 2d arrays
 * of image paths with 2d arrays of character names.
 */
Database.prototype.getCharactersCollection = function(callback){
    this.db.collection('characters', function(error, characters_collection){
        if( error ) callback(error);
        else callback(null, characters_collection);
    });
};

Database.prototype.getCharactersByType = function(type, callback){
    this.getCharactersCollection(function(error, characters_collection){
        if( error ) callback(error);
        else{
            characters_collection.findOne({ type: type }, function(error, results){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};

Database.prototype.saveCharacterSetByType = function(type, arr1, arr2, callback){
    this.getCharactersCollection(function(error, characters_collection){
        if( error ) callback(error);
        else{ 
            characters_collection.save({ type: type, images: arr1, names: arr2 });
            callback(null, 'success!');
        }
    });
};

exports.Database = Database;
