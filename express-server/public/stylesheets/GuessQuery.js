$(document).ready(function(){
	$('#button').click(function(){
		var toAdd = $('input[name=guessItem]').val();
		$('#guess').append('<div class ="item">' + "You: "+ toAdd + '</div>');
		
	});
	$('#chat').click(function(){
		var toAdd = $('input[name=chatItem]').val();
		$('#guessButton').append('<div class ="item">' + "You: "+ toAdd + '</div>');
	});
});