var element = "http://www.clipartsfree.net/vector/medium/purzen_Icon_with_question_mark_Clip_Art.png";
var element1= "http://images2.fanpop.com/image/photos/9000000/Joker-the-joker-9028188-1024-768.jpg";
var arr = new Array();
var toSend = new Array();
var opp = new Array();
var yourTurn = true;
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
                    if( data.redirect ){
                        window.location.href = data.redirect;
                    }
                    $('#guessToScroll').empty();
                    for( var i=0; i<data.guesses.length; i++){
                        $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                    }
                    if( data.player1.name === thisUser.userName ){
                        yourTurn = data.player1.isTurn;
                        toSend = data.player1.board;
                        opp = data.player2.board;
                        updateOpponentArray(opp);
                    } else{
                        yourTurn = data.player2.isTurn;
                        toSend = data.player2.board;
                        opp = data.player1.board;
                        updateOpponentArray(opp);
                    }
                    yourTurn = false;
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
                    for( var i=0; i<data.length; i++ ){
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
                    alert('Game Over: '+data+' wins!');
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
			toSend[i][j] = false;
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
            if(opp[i][j] == false)
                $('#o'+i+''+j).css('background-color','black');
            else{
                $('#o'+i+''+j).css('background-color','white');
            }
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
        for( var i=0; i<data.length; i++ ){
            $('#chatToScroll').append('<div class ="item">' +data[i]);
        }
    });
    $.ajax({
        type: "POST",
        url: '/update-game',
        data: {guess: null, board: toSend, isOppTurn: false},
        success: function(data){
            thisUser = data.user;
            $('#guessToScroll').empty();
            for( var i=0; i<data.guesses.length; i++){
                $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
            }
            if( data.player1.name === thisUser.userName ){
                //Sets up the card that the user will be answering questions about
                $('#yourCard').append('<img src ='+data.player1.charImg+'><br>'+data.player1.charName);
                yourTurn = data.player1.isTurn;
                toSend = data.player1.board;
                opp = data.player2.board;
                updateOpponentArray(opp);
            } else{
                //Sets up the card that the user will be answering questions about
                $('#yourCard').append('<img src ='+data.player2.charImg+'><br>'+data.player2.charName);
                yourTurn = data.player2.isTurn;
                toSend = data.player2.board;
                opp = data.player1.board;
                updateOpponentArray(opp);
            }
        }
    });
    //runs the previously defined methods to set up the game
    startUpPic(arr);
    //updateOpponentArray(opp);
    //Handles the guess div being clicked
    window.setInterval(function() {
        $.post('/update-chat', function(data){
           if( data.redirect ){
               window.location.href = data.redirect;
           }
           if( data === 'Game Over' ){
                alert('Game Over: opponent wins');
                $.get('/account', function(data){
                    if( data.redirect ){
                        window.location.href = data.redirect;
                    }
                });
            } else{
                $('#chatToScroll').empty();
                for( var i=0; i<data.length; i++ ){
                    $('#chatToScroll').append('<div class ="item">' +data[i]);
                }
            }
        });
    }, 3000); // 3 seconds
    window.setInterval(function(){
        $.ajax({
            type: "POST",
            url: '/update-game',
            data: {guess: null, board: toSend, isOppTurn: false},
            success: function(data){
               if( data.redirect ){
                    window.location.href = data.redirect;
                }
                if( data === 'Game Over' ){
                    alert('Game Over: opponent wins');
                    $.get('/account', function(data){});
                } else{
                $('#guessToScroll').empty();
                for( var i=0; i<data.guesses.length; i++){
                    $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                }
                if( data.player1.name === thisUser.userName ){
                    yourTurn = data.player1.isTurn;
                    toSend = data.player1.board;
                    opp = data.player2.board;
                    updateOpponentArray(opp);
                } else{
                    yourTurn = data.player2.isTurn;
                    toSend = data.player2.board;
                    opp = data.player1.board;
                    updateOpponentArray(opp);
                    }
                }
            }
        });
    }, 5000); // 5 seconds
    $('#guessButton').click(function(){
        if((yourTurn === true) && ($('input[name=guessItem]').val() !== "") && ($("input:radio[name='respTF']:checked").val() !== undefined)){
            var toAdd = $("input:radio[name='respTF']:checked").val() + ", " + $('input[name=guessItem]').val();
            $.ajax({
                type: "POST",
                url: '/update-game',
                data: {guess: toAdd, board: toSend, isOppTurn: true},
                success: function(data){
                    if( data.redirect ){
                        window.location.href = data.redirect;
                    }
                    $('#guessToScroll').empty();
                    for( var i=0; i<data.guesses.length; i++){
                        $('#guessToScroll').append('<div class ="item">' +data.guesses[i]);
                    }
                    if( data.player1.name === thisUser.userName ){
                        yourTurn = data.player1.isTurn;
                        toSend = data.player1.board;
                        opp = data.player2.board;
                        updateOpponentArray(opp);
                    } else{
                        yourTurn = data.player2.isTurn;
                        toSend = data.player2.board;
                        opp = data.player1.board;
                        updateOpponentArray(opp);
                    }
                    yourTurn = false;
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
                    for( var i=0; i<data.length; i++){
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
            if(toSend[x][y] == false){
                $(this).fadeTo("fast", 0.3);
                toSend[x][y] = true;
                opp[x][y] = true;
            }
            else{
                $(this).fadeTo("fast", 1.0);
                toSend[x][y] = false;                
                opp[x][y] = false;
            }
        }
        //$('body').append('<div>' + x +' '+y+ '</div>');
    });
});
