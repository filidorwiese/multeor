$(document).ready(function(){


    sessionStorage.clear();

    $('#play-fb').on('click', function(event) {
        event.preventDefault();
        if (fbLoggedIn()) {
            fbGetProfile(function(){
                //console.log(sessionStorage.getItem('facebook-profile'));
                //console.log('redirect 1');
                document.location = '/controller/';
            });
        } else {
            fbLogin(function(status){
                if (status) {
                    fbGetProfile(function(){
                        //console.log(sessionStorage.getItem('facebook-profile'));
                        //console.log('redirect 2');
                        document.location = '/controller/';
                    });
                } else {
                    alert('Could not connect to Facebook');
                }
            });
        }
    });

    $('#play-anon').on('click', function(event) {
        event.preventDefault();
        document.location = '/controller/';
    });

    /*
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
    });*/

});