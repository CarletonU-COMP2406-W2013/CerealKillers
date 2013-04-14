var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

/**
 * Create DB
 */
Database = function(host, port){
    this.db = new Db('guess-mongo', new Server(host, port, {safe:true}, {auto_reconnect:true}));
    this.db.open(function(){});
};



/**
 * 'games' Collection
 */
Database.prototype.getGames = function(callback){
    this.db.collection('games', function(error, game_collection){
        if( error ) callback(error);
        else callback(null, game_collection);
    });
};

/* form a game between two users */
Database.prototype.createGame = function(name1, name2, type, callback){
    var that = this; // workaround!
    /* create two game boards as 2D arrays */
    var b1 = new Array(6);
    var b2 = new Array(6);

    for( var i=0; i<4; i++ ){
        b1[i] = new Array(4);
        b2[i] = new Array(4);

        /* all positions are true; all characters are shown */
        for( var j=0; j<6; j++ ){
            b1[i][j] = 'false';
            b2[i][j] = 'false';
        }
    }
    /* choose a random card for each player */
    var x1 = Math.floor((Math.random()*4));
    var y1 = Math.floor((Math.random()*6));
    var x2 = Math.floor((Math.random()*4));
    var y2 = Math.floor((Math.random()*6));
    var i1, i2, n1, n2;
    this.getCharactersByType(type, function(error, results){
        if( error ) callback(error);
        else{ 
            i1 = results.images[x1][y1];
            n1 = results.names[x1][y1];
            i2 = results.images[x2][y2];
            n2 = results.names[x2][y2];
            /* create the user objects */
            var user1 = {
                name:  name1,
                board: b1,
                charImg: i1,
                charName: n1,
                isTurn: true
            };
            var user2 = {
                name: name2,
                board: b2,
                charImg: i2,
                charName: n2,
                isTurn: false
            };
            that.getGames(function(error, game_collection){
                game_collection.save({ theme: type, player1: user1, player2: user2,
                guesses: [], chat: [] });
                callback(null, 'success');
            });
        }
    });
};

Database.prototype.findGame = function(name1, name2, type, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ 'player1.name': name1, 'player2.name': name2, theme: type },
            function(error, results){
                if( results === null || error ){
                    game_collection.findOne({ 'player1.name': name2, 'player2.name': name1, theme: type },
                    function(error, results){
                        if( results === null || error ) callback('error finding game');
                        else{
                            callback(null, results);
                        }
                    });
                } else{
                    callback(null, results);
                }
            });
        }
    });
};

/* is this user player 1? */
Database.prototype.isPlayer1 = function(id, name){
    this.findGameById(id, function(error, results){
        if( error ) console.log(error);
        else{
            if( results.player1.name === name ){
                return true;
            } else if( results.player2.name === name ){
                return false;
            } else{
                console.log('error, user not in game');
            }
        }
    });
};

/* find a game by looking in two users*/
Database.prototype.findGameInUsers = function(name1, name2, type, callback){
    var arr1, arr2;
    /* set arr1 = name1's games */
    this.getUsersGames(name1, function(error, results){
        if( error ){
            return callback(error);
        }
        else arr1 = results.games;
    });
    /* arr2 = name2's games */
    this.getUsersGames(name2, function(error, results){
        if( error ){
            return callback(error);
        }
        else arr2 = results.games;
    });
    // if the arrays exist
    if(!( arr1 == undefined || arr2 == undefined )){
        for( var i=0; i<arr1.length; i++ ){
            if( arr1[i].theme === type && arr1[i].opponent === name2 ){
                for( var j=0; j<arr2.length; j++ ){
                    if( arr2[j].theme === type && arr2[j].opponent === name1){
                        // Match found!
                        return callback(null, arr2[j]); // arr1[i] == arr2[j]
                    } // fi
                } // rof
            } // fi
        } // rof    
    } else callback('no game found', null); // no game found
};

/* update a game's state */
Database.prototype.updateGameBoard = function(id, name, board, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else if( board ){
            game_collection.findOne({ _id: ObjectID(id) }, function(error, results){
                if( error ) callback(error);
                else if( results === null){
                    callback('error');
                } else{
                    if( results.player1.name === name ){
                        results.player1.board = board;    
                    } else{
                        results.player2.board = board;
                    }
                    game_collection.update({ _id: ObjectID(id) }, { '$set': 
                    { player1: results.player1, player2: results.player2 } });
                    callback(null, 'success!');
                }
            });
        } else{
            callback(null, 'no board provided');
        }
    });
};

Database.prototype.updateGameGuess = function(id, name, guess, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.update({ _id: ObjectID(id) }, { '$push': { 'guesses': guess } });
            callback(null, 'success!');
        }
    });
};

Database.prototype.switchTurns = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ _id: ObjectID(id) }, function(error, results){
                if( error ) callback(error);
                else{
                    results.player1.isTurn = !results.player1.isTurn;
                    results.player2.isTurn = !results.player2.isTurn;
                    game_collection.update({ _id: ObjectID(id) }, 
                    { '$set': { player1: results.player1, player2: results.player2 } });
                    callback(null, 'success!');
                }
            });
        }
    });
};

/* update game's chat feed */
Database.prototype.updateChatById = function(id, string, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.update({ _id: ObjectID(id) }, { '$push': { 'chat': string } });
            callback(null, 'success');
        }
    });
};

/* get game's chat feed */
Database.prototype.findChatById = function(id, callback){
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.findOne({ _id: ObjectID(id) }, function(error, results){
                if( error ) callback(error);
                else if( results === null ){
                    callback('error');
                }
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
        else{
            game_collection.findOne({ _id: ObjectID(id) }, function(error, results){
                if( error ) callback(error);
                else if( results ) callback(null, results);
                else callback('error finding game');
            });
        }
    });
};

/* end a game */
Database.prototype.endGameById = function(Game, callback){
    var that = this; // workaround!
    this.getGames(function(error, game_collection){
        if( error ) callback(error);
        else{
            game_collection.remove({ _id: ObjectID(Game._id) }, function(error, results){
                if( error ) callback(error);
                else {
                    that.removeGameFromUser(Game._id, Game.player1.name, function(error, results){
                        if( error ) callback(error);
                        else{
                            that.removeGameFromUser(Game._id, Game.player2.name, function(error, results){
                                if( error ) callback(error);
                                else{
                                    return callback(null, 'success, game removed!');
                                }
                            });
                        }
                    });
                    callback('error removing game');
                }
            });
        }
    });
};



/**
 * 'users' Collection
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
            password: user.password, games: [], gameCred: 0 });
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
                    var arr = user_collection.find({ userName: name }, { games: 1, _id: 0 });
                    for( var i=0; i<arr.size; i++ ){
                        game_collection.remove({ _id: ObjectID(arr[i]) });
                    } // rof
                } // esle
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
            user_collection.find().toArray(function(error, array){
                if( error ) callback(error);
                else callback(null, array);
            });
        }
    });
};

/* find user with matching name and password */
Database.prototype.login = function(name, pass, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name, password: pass }, function(error, results){
                if( error ) callback(error);
                else callback(null, results);
            });
        }
    });
};

/* get a user by name */
Database.prototype.getUser = function(name, callback){
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

/* add a game to user */
Database.prototype.addGameToUser = function(Game, name, isNewReq, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            var opponent;
            if( Game.player1.name === name ) 
                opponent = Game.player2.name;
            else 
                opponent = Game.player1.name;
            var game = {
                id: Game._id,
                type: Game.theme,
                opp: opponent,
                newReq: isNewReq // (bool) this game is a request
            };
            if( !opponent ) callback('error no opponent', null);
            else{
                user_collection.update({ userName: name }, {'$push': { games: game } })
                callback(null, 'success');
            }
        }
    });
};

Database.prototype.removeGameFromUser = function(_id, name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name }, function(error, results){
                if( error ) callback(error);
                else{
                    var arr = results.games;
                    var b = _id;
                    for( var i=0; i<arr.length; i++ ){
                        var a = arr[i].id;
                        if( a == b ){
                            arr.splice(i, 1);
                            user_collection.update({ userName: name }, { '$set': { games: arr } });
                            console.log('game removed from user: '+name);
                            callback(null, 'success!');
                            return;
                        } // fi
                    } // rof
                    callback('error, game not found in user: '+name);
                }
            });
        }
    });
};

Database.prototype.incrementUsersCred = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name }, function(error, results){
                if( error ) callback(error);
                else{
                    results.gameCred += 100;
                    user_collection.update({ userName: name }, { '$set': { gameCred: results.gameCred } });
                    callback(null, 'success!');
                }
            });
        }
    });
};

Database.prototype.decrementUsersCred = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.findOne({ userName: name }, function(error, results){
                if( error ) callback(error);
                else{
                    results.gameCred -= 20;
                    user_collection.update({ userName: name }, { '$set': { gameCred: results.gameCred } });
                    callback(null, 'success!');
                }
            });
        }
    });
};

/* returns a user's active games. Can get games using these. */
Database.prototype.getUsersGames = function(name, callback){
    this.getUsers(function(error, user_collection){
        if( error ) callback(error);
        else{
            user_collection.find({ userName: name }, function(error, results){
                if( error ) callback(error);
                else{
                    results.toArray(function(error, array){
                        if( error ) callback(error);
                        else callback(null, array);
                    });
                }
            });
        }
    });
};



/**
 * 'characters' Collection
 */
Database.prototype.getCharactersCollection = function(callback){
    this.db.collection('characters', function(error, characters_collection){
        if( error ) callback(error);
        else callback(null, characters_collection);
    });
};

/* get list of game types */
Database.prototype.getGameTypes = function(callback){
    this.setupMovieChars();
    this.setupSSBChars();
    this.setupHistoricChars();
    this.getCharactersCollection(function(error, characters_collection){
        if( error ) callback(error);
        else{
            characters_collection.find(function(error, results){
                if( error ) callback(error);
                else{
                    results.toArray(function(error, array){
                        if( error ) callback(error);
                        else callback(null, array);
                    });
                }
            });
        }
    });
};

/* get set of characters to populate game board */
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

/* save a new set of characters */
Database.prototype.saveCharacterSetByType = function(type, arr1, arr2, callback){
    this.getCharactersCollection(function(error, characters_collection){
        if( error ) callback(error);
        else{
            characters_collection.findOne({ type: type }, function(error, results){
                if( results !== null || error ) return;
                else{
                    characters_collection.save({ type: type, images: arr1, names: arr2 });
                    callback(null, 'success!');
                }
            });
        }
    });
};

/**
 * Sets up an array of image paths
 * for to populate a game of 'Move Characters'
 */
Database.prototype.setupMovieChars = function(){
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
    imgArr[1][0] = 'images/MovieCharacters/Dirty-Harry.jpg';
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
    nameArr[1][0] = 'Dirty Harry';
    nameArr[1][1] = 'Dominic Toretto';
    nameArr[1][2] = 'The Hulk';
    nameArr[1][3] = 'Human Torch';
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
    nameArr[3][0] = 'Terminator';
    nameArr[3][1] = 'Thor';
    nameArr[3][2] = 'Lara Croft';
    nameArr[3][3] = 'Darth Vader';
    nameArr[3][4] = 'Wolverine';
    nameArr[3][5] = 'Loki';

    /* Save the Arrays to db.charactersCollection */
    this.saveCharacterSetByType('Movie Characters', imgArr, nameArr, function(error, results){
        if( error ){
            console.log(error);
        } else{
            console.log(results);
        }
    });
};
Database.prototype.setupSSBChars = function(){
    /* The array of image paths */
    var imgArr = new Array(4);
    for( var i=0; i<4; i++ ){
        imgArr[i] = new Array(6);
    }
    /* Row 0 */
    imgArr[0][0] = 'images/SuperSmashBros/Bowser.jpg';
    imgArr[0][1] = 'images/SuperSmashBros/Charizard.png';
    imgArr[0][2] = 'images/SuperSmashBros/CptFalcon.jpg';
    imgArr[0][3] = 'images/SuperSmashBros/Diddy.jpeg';
    imgArr[0][4] = 'images/SuperSmashBros/DK.jpg';
    imgArr[0][5] = 'images/SuperSmashBros/Falco.jpg';
    /* Row 1 */
    imgArr[1][0] = 'images/SuperSmashBros/JigglyPuff.jpg';
    imgArr[1][1] = 'images/SuperSmashBros/Kirby.png';
    imgArr[1][2] = 'images/SuperSmashBros/Link.jpeg';
    imgArr[1][3] = 'images/SuperSmashBros/Lucas.jpg';
    imgArr[1][4] = 'images/SuperSmashBros/Luigi.jpeg';
    imgArr[1][5] = 'images/SuperSmashBros/Mario.jpeg';
    /* Row 2 */
    imgArr[2][0] = 'images/SuperSmashBros/Ness.jpg';
    imgArr[2][1] = 'images/SuperSmashBros/Olimar.png';
    imgArr[2][2] = 'images/SuperSmashBros/Peach.jpg';
    imgArr[2][3] = 'images/SuperSmashBros/Pikachu.jpg';
    imgArr[2][4] = 'images/SuperSmashBros/ROB.jpg';
    imgArr[2][5] = 'images/SuperSmashBros/Samus.jpg';
    /* Row 3 */
    imgArr[3][0] = 'images/SuperSmashBros/Sheik.jpg';
    imgArr[3][1] = 'images/SuperSmashBros/StarFox.jpg';
    imgArr[3][2] = 'images/SuperSmashBros/StarWolf.jpg';
    imgArr[3][3] = 'images/SuperSmashBros/wario.jpg';
    imgArr[3][4] = 'images/SuperSmashBros/Yoshi.jpg';
    imgArr[3][5] = 'images/SuperSmashBros/Zelda.png';

    /* The array of character names corresponding to each image. */
    var nameArr = new Array(4);
    for( var i=0; i<4; i++ ){
        nameArr[i] = new Array(6);
    }
    /* Row 0 */
    nameArr[0][0] = 'Bowser';
    nameArr[0][1] = 'Charizard';
    nameArr[0][2] = 'CptFalcon';
    nameArr[0][3] = 'Diddy';
    nameArr[0][4] = 'DK';
    nameArr[0][5] = 'Falco';
    /* Row 1 */
    nameArr[1][0] = 'JigglyPuff';
    nameArr[1][1] = 'Kirby';
    nameArr[1][2] = 'Link';
    nameArr[1][3] = 'Lucas';
    nameArr[1][4] = 'Luigi';
    nameArr[1][5] = 'Mario';
    /* Row 2 */
    nameArr[2][0] = 'Ness';
    nameArr[2][1] = 'Olimar';
    nameArr[2][2] = 'Peach';
    nameArr[2][3] = 'Pikachu';
    nameArr[2][4] = 'ROB';
    nameArr[2][5] = 'Samus';
    /* Row 3 */
    nameArr[3][0] = 'Sheik';
    nameArr[3][1] = 'StarFox';
    nameArr[3][2] = 'StarWolf';
    nameArr[3][3] = 'Wario';
    nameArr[3][4] = 'Yoshi';
    nameArr[3][5] = 'Zelda';

    /* Save the Arrays to db.charactersCollection */
    this.saveCharacterSetByType('Super Smash Bros', imgArr, nameArr, function(error, results){
        if( error ){
            console.log(error);
        } else{
            console.log(results);
        }
    });
};
Database.prototype.setupHistoricChars = function(){
    /* The array of image paths */
    var imgArr = new Array(4);
    for( var i=0; i<4; i++ ){
        imgArr[i] = new Array(6);
    }
    /* Row 0 */
    imgArr[0][0] = 'images/HistoricFigures/DjangoReinhardt.jpg';
    imgArr[0][1] = 'images/HistoricFigures/Einstein.jpeg';
    imgArr[0][2] = 'images/HistoricFigures/EleanorRoosevelt.jpg';
    imgArr[0][3] = 'images/HistoricFigures/Galileo.jpg';
    imgArr[0][4] = 'images/HistoricFigures/Gandhi.jpg';
    imgArr[0][5] = 'images/HistoricFigures/GeorgeWashington.jpg';
    /* Row 1 */
    imgArr[1][0] = 'images/HistoricFigures/JohnAMac.jpeg';
    imgArr[1][1] = 'images/HistoricFigures/JuliusCaesar.jpg';
    imgArr[1][2] = 'images/HistoricFigures/Lincoln.jpeg';
    imgArr[1][3] = 'images/HistoricFigures/MartinLKJR.jpg';
    imgArr[1][4] = 'images/HistoricFigures/MotherTeresa.jpg';
    imgArr[1][5] = 'images/HistoricFigures/Mozart.jpg';
    /* Row 2 */
    imgArr[2][0] = 'images/HistoricFigures/Newton.jpg';
    imgArr[2][1] = 'images/HistoricFigures/Shakespeare.jpg';
    imgArr[2][2] = 'images/HistoricFigures/Socrates.jpg';
    imgArr[2][3] = 'images/HistoricFigures/Stalin.jpeg';
    imgArr[2][4] = 'images/HistoricFigures/ThomasEdison.jpg';
    imgArr[2][5] = 'images/HistoricFigures/ThomasJefferson.jpg';
    /* Row 3 */
    imgArr[3][0] = 'images/HistoricFigures/WinstonChurchill.jpg';
    imgArr[3][1] = 'images/HistoricFigures/joanofarc.gif';
    imgArr[3][2] = 'images/HistoricFigures/king-tut.jpg';
    imgArr[3][3] = 'images/HistoricFigures/leonardkleinrock.jpeg';
    imgArr[3][4] = 'images/HistoricFigures/linustorvalds.jpg';
    imgArr[3][5] = 'images/HistoricFigures/plato.jpg';

    /* The array of character names corresponding to each image. */
    var nameArr = new Array(4);
    for( var i=0; i<4; i++ ){
        nameArr[i] = new Array(6);
    }
    /* Row 0 */
    nameArr[0][0] = 'Django Reinhardt';
    nameArr[0][1] = 'Albert Einstein';
    nameArr[0][2] = 'Eleanor Roosevelt';
    nameArr[0][3] = 'Galileo';
    nameArr[0][4] = 'Gandhi';
    nameArr[0][5] = 'George Washington';
    /* Row 1 */
    nameArr[1][0] = 'John A. Macdonald';
    nameArr[1][1] = 'Julius Caesar';
    nameArr[1][2] = 'Abraham Lincoln';
    nameArr[1][3] = 'Martin Luther King Jr.';
    nameArr[1][4] = 'Mother Teresa';
    nameArr[1][5] = 'Mozart';
    /* Row 2 */
    nameArr[2][0] = 'Isaac Newton';
    nameArr[2][1] = 'Shakespeare';
    nameArr[2][2] = 'Socrates';
    nameArr[2][3] = 'Joseph Stalin';
    nameArr[2][4] = 'Thomas Edison';
    nameArr[2][5] = 'Thomas Jefferson';
    /* Row 3 */
    nameArr[3][0] = 'Winston Churchill';
    nameArr[3][1] = 'Joan of Arc';
    nameArr[3][2] = 'King Tut';
    nameArr[3][3] = 'Leonard Klienrock';
    nameArr[3][4] = 'Linus Torvalds';
    nameArr[3][5] = 'Plato';

    /* Save the Arrays to db.charactersCollection */
    this.saveCharacterSetByType('Historic Figures', imgArr, nameArr, function(error, results){
        if( error ){
            console.log(error);
        } else{
            console.log(results);
        }
    });
};


exports.Database = Database;
