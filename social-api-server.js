var express = require("express");
var request = require("superagent");
var app = express();
app.use(express.logger());
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader("Expires", new Date(Date.now() + 240000).toUTCString());
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.get('/', function(req, res) {
  var options = {};
	if(typeof req.query.type === 'undefined') {
    res.send({error: 'You have to specify a type of stats (type=facebook,type=twitter)'});
    return;
	}
  options.type = req.query.type;
  if(typeof req.query.url !== 'undefined') {
    options.url = req.query.url;
  } else {
    options.url = req.header('Referer');
  }
  switch(options.type) {
    case 'facebook-event':
      getFBEvents(options, req, res);
      break;
    case 'facebook':
      callFB(options, req, res);
      break;
    case 'twitter':
      callTwitter(options, req, res);
      break;
    case 'googleplus':
      callGooglePlus(options, req, res);
      break;
    default:
      res.send({error: 'Invalid type'});
      
  }
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
var FB = require('fb');
    var accessToken;

FB.api('oauth/access_token', {
    client_id: '341203879345622',
    client_secret: process.env.CLIENTSECRET,
    grant_type: 'client_credentials'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    accessToken = res.access_token;
});


var callTwitter = function(options, req, res) {
  var apiUrl = "http://urls.api.twitter.com/1/urls/count.json?url=" + options.url;
  request.get(apiUrl)
          .set('Accept', 'application/json')
          .end(function(data){
            console.log(data);
            res.send(data.body);
          });
}
var callFB = function(options, req, res){
  var apiUrl = "https://graph.facebook.com/fql?q=SELECT%20url,%20normalized_url,%20share_count,%20like_count,%20comment_count,%20total_count,commentsbox_count,%20comments_fbid,%20click_count%20FROM%20link_stat%20WHERE%20url='"+options.url+"'";
  request.get(apiUrl)
          .set('Accept', 'application/json')
          .end(function(data){
            console.log(data);
            res.send(data.body);
          });
}

var callGooglePlus = function(options, req, res){
  var apiUrl = "https://plusone.google.com/_/+1/fastbutton?url=" + options.url;
  request.get(apiUrl)
          .end(function(data){
            var reg = /__SSR \= \{c\: (.*?)\.0/g
            var result = reg.exec(data.text);
            if(result) {

              var count = result[1];
              res.send({count: count});
            } else {
              res.send({count: 0})
            }
          });
}

var getFBEvents = function (options,req,res){
  console.log(options.url + "&method=GET&format=json&access_token=" + accessToken);
    var https = require('https');
    var options = {
      host: 'graph.facebook.com',
      port: 443,
      path: options.url + "&method=GET&format=json&access_token=" + accessToken
    };
    https.get(options, function(resp){
      resp.setEncoding('utf8');
      var chunks = '';
      resp.on('data', function(chunk){
        chunks += chunk;
      });

      resp.on('end', function(){
        //do something with chunk
        res.send(JSON.parse(chunks));
      });
    }).on("error", function(e){
      console.log("Got error: " + e.message);
    });
}

