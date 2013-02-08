/* ---------------------------------------------------------------------------

 Init PubNub and Get your PubNub API Keys:
 http://www.pubnub.com/account#api-keys

 --------------------------------------------------------------------------- */
//console.log('Broadcasting Messages from Node...');
//require('child_process').exec('open index.html');

var pubnub = require("../pubnub.js").init({
    publish_key   : "pub-c-bbeeda7d-a382-4f21-b11b-2599cf187063",
    subscribe_key : "sub-c-fab86416-70b4-11e2-9325-12313f022c90"
});

/* ---------------------------------------------------------------------------
 Listen for Messages
 --------------------------------------------------------------------------- */
pubnub.subscribe({
    channel  : 'client_a',
    callback : function(message) {
        console.log(' > client_a:  ' + message);
        pubnub.publish({
            channel : 'server_b',
            message : message
        });
    }
});


pubnub.subscribe({
    channel  : 'client_b',
    callback : function(message) {
        console.log(' > cleint_b:  ' + message);
        pubnub.publish({
            channel : 'server_a',
            message : message
        });
    }
});


