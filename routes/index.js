var request = require('request');

module.exports = function (app) {

	app.get('/',function(req,res){
	  res.render('index.ejs');
	});

	app.get('/trips', function(req, res){
		var params = {
			"airport" : "LAX",
			"startDate" : "2015-02-06",
			"endDate" : "2015-02-11"
		};
		request({
			method: 'GET',
			uri: 'http://www.skyscanner.com/dataservices/browse/v1.1/US/USD/en-US/destinations/' +  params.airport + '/US/' + params.startDate + '/' + params.endDate + '/?includequotedate=true&includemetadata=true&includecityid=false',
			json: true
		},
		function(error, response, body){
			if(!error)
			{
				var popFlights = PopularTrips(body.Routes);	
				var prices = PriceByTrip(popFlights, body.Quotes)	
				res.send(popFlights);

			}
		});
	});
}

//returns array of trips with popularity rank greater than 0
var PopularTrips = function(flights){
	var result = [];
	for(var i = 0;i<flights.length;i++){
		if(flights[i].PopularityRank > 0){
			result.push(flights[i]);
		}
	}
	return result;
}

//finds prices using trip ids and combines into one object
var PriceByTrip = function(flights, quotes){
	var result = [];
	var obj = {
		"RouteId" : "",
		"OriginId" : "",
		"DestinationId" : "",
		"Direct" : "",
		"Price" : "",
		"Inbound_Carrier" : "",
		"Inbound_Agent" : "",
		"Outbound_Carrier" : "",
		"Outbound_Agent" : ""}
	}
	for(var i = 0;i<flights.length;i++){
		for(var k = 0;k<quotes.length;k++){
			if(flights.RouteId === quotes.RouteId){
				
			}
		}
	}
}



















