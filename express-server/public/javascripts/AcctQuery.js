$(document).ready(function(){
    $.get('/game-types', function(data){
        var options = $('#options');
        for( var i=0; i<data.length; i++ ){
            options.append($('<option />').val(data[i].type).text(data[i].type));
        }
    });
    $.get('notify-cred', function(data){
        if( data === 'increase'){
            alert('Congratulations: you have earned 100 credits');
        } else if( data === 'decrease' ){
            alert('Sorry: you lost 20 credits from your last game.');
        }
    });
});
