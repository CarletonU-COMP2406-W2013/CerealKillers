var arr = new Array();
var toSend = new Array();
var opp = new Array();
var yourTurn = true;
var beenPrompted = false;
var thisUser;
//Declaration of the Item object for the table

//When the enter button is pressed:
//	-it reads in whatever is in the input field
//	-checks if it is the current user's turn and if it is it will post the contents to the page and send it to the server
function runGuess(e) {
    if (e.keyCode == 13) {
    	if((yourTurn === true) && ($('input[name=guessItem]').val() !== "") && ($("input:radio[name='respTF']:checked").val() !== undefined)){
            var toAdd = $("input:radio[name='respTF']:checked").val() + ", " + $('input[name=guessItem]').val();
            $.ajax({
                type: "POST",
                url: '/update-game',
                data: {guess: toAdd, board: toSend, isOppTurn: true},
                success: function(data){
                    $('#guessToScroll').empty();
                    for( var i=data.guesses.length-1; i>=0; --i){
                        $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                    }
                    if( data.player1.name === thisUser.userName ){
                        yourTurn = data.player1.isTurn;
                        updateOpponentArray(data.player2.board);
                    } 
                    else{
                        yourTurn = data.player2.isTurn;
                        updateOpponentArray(data.player1.board);
                    }
                    yourTurn = false;
                    beenPrompted = false;
                }   
            });
        } else{
            alert("Waiting for opponent");
        }
        $('input[name=guessItem]').val("");
        return false;
    }
}
//When the enter button is pressed:
//	-it reads in whatever is in the input field
//	-posts the contents to the page and send it to the server
function runChat(e){
	if(e.keyCode == 13){
		var toAdd = $('input[name=chatItem]').val();
		if(toAdd != ""){
            $.ajax({
                type: "POST",
                data: { message: toAdd },
                url: '/update-chat',
                success: function(data){
                    $('#chatToScroll').empty();
                    for( var i=data.length-1; i>=0; --i ){
                        $('#chatToScroll').append('<div class ="item">' +data[i]);
                    }
                }
            });
        }
		$('input[name=chatItem]').val("");
		return false;
	}
}
function runFinalGuess(e){
    if(e.keyCode == 13){
        var toAdd = $('input[name=finalItem]').val();
        if(toAdd != ""){
            $.ajax({
                type: "POST",
                data: { finalGuess: toAdd },
                url: '/final-guess',
                success: function(data){
                    alert(data+' wins!');
                }
            });
        }
        return false;
    }
}
//initializes the two dimensional array of boolean values "toSend" all to true
var startUpSendArray = function(toSend){
	for(var i=0;i<4;i++){
		toSend[i] = new Array();
		for(var j=0;j<6;j++){
			toSend[i][j] = 'false';
		}
	}
}
//Gets the array of pictures to be used for the game and iterates through it filling the table with 
//		pictures and assigning them unique ids
var startUpPic = function(arr){
    // pull the characters from db
    $.get('/game-characters', function(data){
        arr = data;
        for(var i=0;i<4;i++){
            $('#board').append('<tr id=row'+i+'>');
            for(var j=0;j<6;j++){
                $('#row'+i).append('<td class = "boardElement" id='+i+''+j+'><img src ='+data.images[i][j]+'><br>'
                    +data.names[i][j]+'</td>');
            }
            $('#board').append('</tr>');
        }
    }); 
};
var startOpponentArray = function(opp){
    $('#opponent').append('<table id="oTable">');
    for(var i=0;i<4;i++){
        opp[i] = new Array();
        $('#oTable').append('<tr id=orow'+i+'>');
        for(var j=0;j<6;j++){
            opp[i][j] = false;
            $('#orow'+i).append('<td id=o'+i+''+j+'><div id=oElement></div></td>');
        }
        $('#oTable').append('</tr>');
    }
    $('#opponent').append('</table>');
};
var updateOpponentArray = function(opp){
    for(var i=0;i<4;i++){
        for(var j=0;j<6;j++){
            if(opp[i][j] === 'false'){
                $('#o'+i+''+j).css('background-color','white');
            } else{
                $('#o'+i+''+j).css('background-color','black');
            }
        }
    }
};
var updateYourBoard = function(ts){
    for(var i=0;i<4;i++){
        for(var j=0;j<6;j++){
            if(ts[i][j] === 'true'){
                toSend[i][j] = 'true';
                $('#'+i+''+j).fadeTo("fast", 0.3);
            } else toSend[i][j] = 'false';
        }
    }
};
    /*****************************************
     * 		       DOC IS READY              *
     *****************************************/
$(document).ready(function(){
    startUpSendArray(toSend);
    startOpponentArray(opp);
    $.post('/update-chat', function(data){
        $('#chatToScroll').empty();
        for( var i=data.length-1; i>=0; --i ){
            $('#chatToScroll').append('<div class ="item">' +data[i]);
        }
    });
    $.ajax({
        type: "POST",
        url: '/update-game',
        data: {guess: null, board: null, isOppTurn: false},
        success: function(data){
            thisUser = data.user;
            $('#guessToScroll').empty();
            for( var i=data.guesses.length-1; i>=0; --i){
                $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
            }
            if( data.player1.name === thisUser.userName ){
                //Sets up the card that the user will be answering questions about
                $('#yourCard').append('<img src ='+data.player1.charImg+'><br>'+data.player1.charName);
                updateYourBoard(data.player1.board);
                yourTurn = data.player1.isTurn;
                updateOpponentArray(data.player2.board);
            } 
            else{
                //Sets up the card that the user will be answering questions about
                $('#yourCard').append('<img src ='+data.player2.charImg+'><br>'+data.player2.charName);
                updateYourBoard(data.player2.board);
                yourTurn = data.player2.isTurn;
                updateOpponentArray(data.player1.board);
            }
            if(yourTurn && !beenPrompted){
                alert("It's your turn");
                beenPrompted = true;
            }
        }
    });
    //runs the previously defined methods to set up the game
    startUpPic(arr);
    //updateOpponentArray(opp);
    //Handles the guess div being clicked
    window.setInterval(function() {
        $.post('/update-chat', function(data){
           if( data === 'Game Over' ){
               alert('Game Over!');
               window.location = '/account';
            } else{
                $('#chatToScroll').empty();
                for( var i=data.length-1; i>=0; --i ){
                    $('#chatToScroll').append('<div class ="item">' +data[i]);
                }
            }
        });
    }, 1000); // 1 second
    window.setInterval(function(){
        $.ajax({
            type: "POST",
            url: '/update-game',
            data: {guess: null, board: toSend, isOppTurn: false},
            success: function(data){
                $('#guessToScroll').empty();
                for( var i=data.guesses.length-1; i>=0; --i){
                    $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                }
                if( data.player1.name === thisUser.userName ){
                    yourTurn = data.player1.isTurn;
                    updateOpponentArray(data.player2.board);
                    updateYourBoard(data.player1.board);
                } 
                else{
                    yourTurn = data.player2.isTurn;
                    updateOpponentArray(data.player1.board);
                    updateYourBoard(data.player2.board);
                }
                if(yourTurn && !beenPrompted){
                    alert("It's your turn");
                    beenPrompted = true;
                }
            }
        });
    }, 3000); // 3 seconds
    $('#guessButton').click(function(){
        if((yourTurn === true) && ($('input[name=guessItem]').val() !== "") && ($("input:radio[name='respTF']:checked").val() !== undefined)){
            var toAdd = $("input:radio[name='respTF']:checked").val() + ", " + $('input[name=guessItem]').val();
            $.ajax({
                type: "POST",
                url: '/update-game',
                data: {guess: toAdd, board: toSend, isOppTurn: true},
                success: function(data){
                    $('#guessToScroll').empty();
                    for( var i=data.guesses.length-1; i>=0; --i ){
                        $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                    }
                    if( data.player1.name === thisUser.userName ){
                        yourTurn = data.player1.isTurn;
                        updateOpponentArray(data.player2.board);
                    } else{
                        yourTurn = data.player2.isTurn;
                        updateOpponentArray(data.player1.board);
                    }
                    yourTurn = false;
                    beenPrompted = false;
                }   
            });
        } else{
            alert("Waiting for opponent");
        }
        $('input[name=guessItem]').val("");
    });
    //handles the chat div being clicked
    $('#chatButton').click(function(){
        var toAdd = $('input[name=chatItem]').val();
        if(toAdd != ""){
            $.ajax({
                type: "POST",
                url: '/update-chat',
                data: {message: toAdd},
                success: function(data){
                    $('#chatToScroll').empty();
                    for( var i=data.length-1; i>=0; --i ){
                        $('#chatToScroll').append('<div class ="item">' +data[i]);
                    }
                }
            });
        }
        //$('#chatToScroll').append('<div class ="item"><b>' + "You: </b>"+ toAdd + '</div>');
        $('input[name=chatItem]').val("");
    });
    //when the user clicks on a picture it will fade out or in and assign the correct value to that position in the array
    $(document).on("click", "td",function(){
        var check = $(this).attr('class');
        if(check == "boardElement"){
            var counter = $(this).attr('id');
            var x = counter.substr(0,1);
            var y = counter.substr(1,2);
            if(toSend[x][y] == 'false'){
                $(this).fadeTo("fast", 0.3);
                toSend[x][y] = 'true';
                opp[x][y] = 'true';
            }
            else{
                $(this).fadeTo("fast", 1.0);
                toSend[x][y] = 'false';                
                opp[x][y] = 'false';
            }
        }
        //$('body').append('<div>' + x +' '+y+ '</div>');
    });
});
