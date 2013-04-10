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
    this.db.collection('game_collection', function(error, game_collection){
        if( error ) callback(error);
        else callback(null, game_collection);
    });
};

/* form a game between two users */
Database.prototype.createGame = function(name1, name2, type, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else {
            /* create two game boards as 2D arrays */
            var b1 = new Array(6);
            var b2 = new Array(6);

            for( var i=0; i<10; i++ ){
                b1[i] = new Array(4);
                b2[i] = new Array(4);

                /* all positions are true; all characters are shown */
                for( var j=0; j<6; j++ ){
                    b1[i][j] = true;
                    b2[i][j] = true;
                }
            }
            /* create the user objects */
            var user1 = {
                name:  name1,
                board: b1,
                isTurn: true
            };
            var user2 = {
                name: name2,
                board: b2,
                isTurn: false
            };
            currId++; // increment id
            game_collection.save({ gameID: currId, gameType: type, player1: user1, player2: user2,
                    guesses: [], chat: [] });
            callback(null, currId);
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
                this.findGameById(id, callback); //all was successful, return this game
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
            callback(null);
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
                else callback(null, result);
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

Database.prototype.logout = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.update({ userName: name }, { '$set': { 'online': 'no' } });
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
