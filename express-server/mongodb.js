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
  this.db= new Db('node-mongodb-guess', new Server(host, port, {auto_reconnect: true}, { }));
  this.db.open(function(){ });
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
Database.prototype.createGame = function(user1, user2, type, callback){
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
            currId++;
            game_collection.save({ gameID: currId, gameType: type, player1: user1, player2: user2,
                    board1: b1, board2: b2, guesses: [], chat: [], turn: user1 });
            callback(currId);
        }
    });
};

/* return board 1 */
Database.prototype.getBoardOneStateById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.find({ gameID: id }, { board1: true }, function(error, result){
                if( error ) callback(error);
                else callback(result);
            });
        }
    });
};

/* return board 2 */
Database.prototype.getBoardTwoStateById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.find({ gameID: id }, { board2: true }, function(error, result){
                if( error ) callback(error);
                else callback(result);
            });
        }
    });
};

/* takes an array of booleans to replace current board1 state */
Database.prototype.setBoardOneStateById = function(id, arr, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else {
            game_collection.update({ gameID: id }, { '$set': { 'board1': arr } });
            callback(null);
        }
    });
};

/* takes an array of booleans to replace currrent board3 state */
Database.prototype.setBoardTwoStateById = function(id, arr, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else {
            game_collection.update({ gameID: id }, { '$set': { 'board2': arr } });
            callback(null);
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

/* update game's guess feed. TODO switch turn */
Database.prototype.takeTurnById = function(id, string, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.update({ gameID: id }, { '$push': { 'guesses': string } });
            game_collection.find({ gameID: id }, { turn: true }, function(error, result){
                if( error ) callback(error);
                else callback(result);
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

/* simple user until system is further developed */
Database.prototype.saveSimpleUser = function(user, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.save({ userName: user.name, online: 'yes', currGameID: -1 });
        }
    });
};

Database.prototype.saveUser = function(user, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else {
            user_collection.save({ userName: user.userName, fName: user.fName, lName: user.lName,
                    password: user.password, online: 'yes', currGameID: -1, gameCred: 0 });
            callback(null);
       }
   });
};

Database.prototype.removeUserByName = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.remove({ userName: name });
            callback(null);
        }
    });
};

/* return array of all signed up users */
Database.prototype.userListing = function(callback){
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

/* return array of online users */
Database.prototype.onlineUsers = function(callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else {
        user_collection.find({ online: 'yes' }, function(error, results){
            if( error ) callback(error)
            else {
                results.toArray(function (error, results){
                    if( error ) callback(error);
                    else callback(null, results);
                });
               }
            });
        }
    });
};

/* only name until system is further developed */
Database.prototype.loginByName = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.update({ userName: name }, { '$set': { 'online': 'yes' } });
            callback(null);
        }
    });
};

Database.prototype.login = function(name, pass, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.find({ userName: name, password: pass }, function(error){
                if( error ) callback(error, false);
                else{
                    user_collection.update({ userName: name }, { '$set': { 'online': 'yes' } });
                    callback(null, true);
                }
            });
        }
    });
};

Database.prototype.logout = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.update({ userName: name }, { '$set': { 'online': 'no' } });
            callback(null);
        }
    });
};

Database.prototype.getUsersCurrGameByName = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
        user_collection.find({ userName: name,  online: 'yes' }, { currGameID: true }, function(error, results, callback){
            if( error ) callback(error);
            else callback(results);
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
                else callback(results);
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
