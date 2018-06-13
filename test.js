const { XMLHttpRequest } = require('./dist/bundles/XMLHttpRequest.umd.min.js');

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://studio.botoflegends.com', false);
xhr.timeout = 100;
xhr.onreadystatechange = function() {
    if(xhr.readyState === XMLHttpRequest.DONE) {
        if(xhr.status === 0) {
            console.log('ERROR');
        } else {
            console.log('SUCCESS');
        }
    }
}
xhr.onloadstart = function() {
    console.log('TIMEOUT');
}
xhr.onerror = function(e) {
    console.log(e);
}
xhr.send();

console.log('DONE');