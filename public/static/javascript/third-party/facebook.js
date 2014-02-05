'use strict';

(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));

var facebookConnected = false;

window.fbAsyncInit = function() {
    FB.init({
        appId      : '530700506998289', // App ID
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });

    FB.Event.subscribe('auth.authResponseChange', function(response) {
        if (response.status === 'connected') {
            facebookConnected = true;
        }
    });
};

function fbLogin(callback) {
    FB.login(function(response){
        if (response.status === 'connected') {
            callback(true);
        } else {
            callback(false);
        }
    });
}

function fbGetProfile(callback) {
    if (!sessionStorage.getItem('facebook-profile')) {
        FB.api('/me?fields=id,name,picture', function(response) {
            sessionStorage.setItem('facebook-profile', JSON.stringify(response));
            callback();
        });
    } else {
        callback();
    }
}

function fbLoggedIn() {
    return facebookConnected;
}

function fbPublish(title, image, callback) {
    //https://developers.facebook.com/docs/guides/attachments/
    FB.ui({
        display: 'popup',
        method: 'feed',
        name: title,
        href: 'http://multeor.com',
        caption: 'Multeor - a multiplayer webgame',
        description: 'Use your mobile to pilot a meteor leaving the biggest trail of destruction (up to 8 players)',
        link: 'http://multeor.com',
        //action_links: [{ text: 'Play', href: 'http://multeor.com' }],
        picture: image
    }, function(response) {
        if (response && response.post_id) {
            callback(true);
        } else {
            callback(false);
        }
    });
}
