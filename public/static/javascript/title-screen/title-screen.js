$(document).ready(function () {

    sessionStorage.clear();
    sessionStorage.setItem('came-from-title-screen', true);

    $('#play-fb a').on('click', function (event) {
        event.preventDefault();

        if (fbLoggedIn()) {
            fbGetProfile(function () {
                document.location = '/controller/';
            });
        } else {
            fbLogin(function (status) {
                if (status) {
                    fbGetProfile(function () {
                        document.location = '/controller/';
                    });
                } else {
                    alert('Could not connect to Facebook');
                }
            });
        }
    });

    $('#play-anon a').on('click', function (event) {
        event.preventDefault();
        document.location = '/controller/';
    });

});