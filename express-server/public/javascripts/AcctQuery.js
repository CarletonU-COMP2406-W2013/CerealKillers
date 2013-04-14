$(document).ready(function(){
    $.get('/game-types', function(data){
        var options = $('#options');
        for( var i=0; i<data.length; i++ ){
            options.append($('<option />').val(data[i].type).text(data[i].type));
        }
    });
});
