
var pubnub = require("../pubnub.js").init({
    publish_key   : "pub-c-bbeeda7d-a382-4f21-b11b-2599cf187063",
    subscribe_key : "sub-c-fab86416-70b4-11e2-9325-12313f022c90"
});
/* ---------------------------------------------------------------------------
 Type Console Message
 --------------------------------------------------------------------------- */

pubnub.subscribe({
    channel  : 'server_a',
    callback : function(message) {
        console.log(' > :  ' + message);
        console.log('\nType a message: ');
    }
});

process.stdin.resume();
process.stdin.setEncoding('utf8');
function write() {
    console.log('\nType a message: ');
    process.stdin.on('data', function(chunk) {
        pubnub.publish({
            channel : 'client_a',
            message : ''+chunk
        });
    });
}
write();
