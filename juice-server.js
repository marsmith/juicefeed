var express    = require('express');
var app        = express();
var request    = require('request');
var async      = require('async');

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

// Retrieve all juicefeed infos
app.get('/juice', function (req, res) {

	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('Request for juice data initiated by:',ip); 

	var instagramURL = 'https://www.instagram.com/';
	var instagramUsers = ['coloniebeverage','troy_beverage','albanyaleandoyster','oliversbeverage','westmerebeverage','beerbonestaproom','mohawktaproom','delmarbeveragecenter','wearepintsized'];
	//var instagramUsers = ['coloniebeverage','remarkableliquids','unifiedbeerworks','bloodville_brewery','singlecutnorth','craftbeercenter','troy_beverage','woodstockbrewing','burlingtonbeer','alchemistbeer','peekskillbrewery','rareformbrewco','fiddleheadbrewing','chathambrewing','druthersbrewing','commonrootsbrewing','paradoxbrewery','adirondackbrewery','suarezfamilybrewery','rootandbranchbrewing','foambrewers','hudsonvalleybrewery','mainebeerco','kcbcbeer','barrierbrewingco','singlecutbeer','otherhalfnyc','nightshiftbeer','bissellbrothers','industrialartsbrewing','lawsonsfinest','treehousebrewco','grimmales','licbeerproject','trilliumbrewing','finbackbrewery','eqbrewery','fobeerco','hillfarmstead','sloopbrewingco','albanyaleandoyster','oliversbeverage','westmerebeverage','beerbonestaproom','mohawktaproom','thecitybeerhall42','district96_beerco','4counties_beerco','delmarbeveragecenter','wearepintsized','sandcitybrewery','frost.beer.works','liquidlyricsbrewing','vanishedvalleybrewing'];
	var numInstagramPosts = 5;
	var dataExp = /window\._sharedData\s?=\s?({.+);<\/script>/;
	var return_data = {};
	var medias = [];

	console.log('2222');


	async.each(instagramUsers, function (user, callback) {	

		console.log('processing:', user);

		var options = {
			url: instagramURL + user,
			headers: {
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4',
				"encoding": "text/html;charset='charset=utf-8'"
			}
		};
	
		request(options, function(err, response, body){
	
			var dataString = body.match(dataExp)[1];
			var data = JSON.parse(dataString);
			if (data) {
	
				var edges = data.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges;
				var venue = data.entry_data.ProfilePage[0].graphql.user.full_name;
				var venueLogo = data.entry_data.ProfilePage[0].graphql.user.profile_pic_url;
	
				for (i = 0; i < numInstagramPosts; i++) { 
					var post = edges[i];
	
					if (post && post.node.edge_media_to_caption.edges[0]) {
	
						var text = post.node.edge_media_to_caption.edges[0].node.text.split();
	
						var post_data = {
							user: user,
							venue: venue,
							venueLogoURL: venueLogo,
							text : text[0],
							thumbnailURL : post.node.thumbnail_resources[3].src,
							imageURL : post.node.display_url,
							date : new Date(post.node.taken_at_timestamp * 1000)
						};

						medias.push(post_data);
	
					}
				}
			}

			callback();
		});
	}, function(err) {
		// if any of the file processing produced an error, err would equal that error
		if( err ) {
		  // One of the iterations produced an error.
		  // All processing will now stop.
		  console.log('A file failed to process');
		} else {
		  console.log('All files have been processed successfully');
		  return_data.instagram = medias;
		  res.send(return_data);
		}
	});


});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);