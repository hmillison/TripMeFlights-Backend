var fs = require('fs'),
express = require('express'),
app = express();
var request = require('request');
var ejs = require('ejs');

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');


var example = __dirname + '/example.json';


var port = process.env.PORT || 3000;    // set our port
require(__dirname + '/routes')(app);

var router = express.Router();


app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.listen(port);
console.log('Listening on port ' + port);
