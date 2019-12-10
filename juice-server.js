var express    = require('express');
var app        = express();

// Constants
var PORT = 8082;
var HOST = '0.0.0.0';

//enable crossdomain
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//define static path for hosting html/JS site
app.use(express.static(__dirname + '/www'));

//forward paths from route
app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);