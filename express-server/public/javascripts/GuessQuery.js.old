var element = "http://www.clipartsfree.net/vector/medium/purzen_Icon_with_question_mark_Clip_Art.png";
var counter = 24;
$(document).ready(function(){
    $('#guessButton').click(function(){
        var toAdd = $('input[name=guessItem]').val();
        $('#guessWindow').append('<div class ="item">' + "You: "+ toAdd + '</div>');
    });
    $('#chatButton').click(function(){
        var toAdd = $('input[name=chatItem]').val();
        $('#chatWindow').append('<div class ="item">' + "You: "+ toAdd + '</div>');
    });
    $("td").click(function(){
        $(this).fadeTo("fast", 0.3);
        counter = counter -1;

        //$('body').append('<div>' + counter + '</div>');
    });
});
