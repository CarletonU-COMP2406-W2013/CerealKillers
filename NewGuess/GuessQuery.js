var element = "http://www.clipartsfree.net/vector/medium/purzen_Icon_with_question_mark_Clip_Art.png";
var element1= "http://images2.fanpop.com/image/photos/9000000/Joker-the-joker-9028188-1024-768.jpg";
var counter = 24;
var arr= new Array();
var toSend = new Array();
//Declaration of the Item object for the table
function Item(pic){
	this.currPicture = pic;
	this.clicked = false;
};
var startUpSend = function(ts){
	for(var i=0;i<6;i++){
		ts[i] = new Array();
		for(var j=0;j<4;j++){
			ts[i][j] = false;
		}
	}
}
var startUpPic = function(arr){
		for(var i=0;i<4;i++){
			$('#board').append('<tr id=row'+i+'>');
			for(var j=0;j<6;j++){
				$('#row'+i).append('<td id='+i+''+j+'><img src ='+element1+'> NAME </td>');
			};
			$('#board').append('</tr>');
		};
	};
$(document).ready(function(){
	/*var img = new Image();
	img.src = element;
	$('#board').append('<tr><td><img src ='+element+'></td>');*/
	startUpPic(arr);
	startUpSend(toSend);
	$('#guessButton').click(function(){
		var toAdd = $('input[name=guessItem]').val();
		$('#guessWindow').append('<div class ="item"><b>' + "You: </b>"+ toAdd + '</div>');
	});
	$('#chatButton').click(function(){
		var toAdd = $('input[name=chatItem]').val();
		$('#chatWindow').append('<div class ="item"><b>' + "You: </b>"+ toAdd + '</div>');

	});
	//fadeout when a picture id clicked
	$("td").click(function(){
		var counter = $(this).attr('id');
		var y = counter.substr(0,1);
		var x = counter.substr(1,2);
		if(toSend[x][y] == false){
			$(this).fadeTo("fast", 0.3);
			toSend[x][y] = true;
		}
		else{
			$(this).fadeTo("fast", 1.0);
			toSend[x][y] = false;
		}
		$('body').append('<div>' + x +' '+y+ '</div>');
	});
});
