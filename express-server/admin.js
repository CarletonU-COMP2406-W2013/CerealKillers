
/**
 * FILE: admin.js 
 * saves game type to the database.
 * may perform other admin specific tasks 
 * that could be risky if given to the client in 'app.js'
 */
var db = require('./guess-db').Database;
var db = new Database('localhost', 27017);

/**
 * Sets up an array of image paths
 * for to populate a game of 'Move Characters'
 */
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

console.log(db);
setupMovieChars();
