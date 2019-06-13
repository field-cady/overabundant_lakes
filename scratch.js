var request = new XMLHttpRequest();
request.open("GET", 'http://www.url.com');
request.onreadystatechange = function() {
if (request.readyState === 4 && request.status === 200) {

//response handling code

}
};
request.send(null);
