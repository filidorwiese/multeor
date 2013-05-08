$(document).ready(function(){

    // tijdelijk voor debugging
    $('form input[name=game]').val(sessionStorage.getItem('game-room'));

    // 
    $('form').on('submit', function(event){
        event.preventDefault();
        var gameRoomInput = $(this).find('input');
        var gameRoom = parseInt(gameRoomInput.val(), 10);
        if (isNaN(gameRoom) || gameRoom < 10000 || gameRoom > 99999) {
            alert('Not a valid code');
            gameRoomInput.val('').focus();
        } else {
            sessionStorage.setItem('game-room', gameRoom);
            document.location = '/controller/';
        }
    });
});