var request = require('request');
var moment = require('moment');
var async = require('async');
var auth = require('../auth');


module.exports = function (app) {

	app.get('/',function(req,res){
	  res.render('index.ejs');
	});

"https://api.datamarket.azure.com/Bing/Search/Image?Query='" +  + "'&$format=json"
	app.get('/search', function(req, res){
		var params = {
			"airport" : "DTW",
			"startDate" : "2015-03-01",
			"endDate" : "2015-03-07"
		};
		if(req.query.airport){
			params.airport = req.query.airport;
		}
		if(req.query.startDate){
			params.startDate = req.query.startDate;
		}
		if(req.query.endDate){
			params.endDate = req.query.endDate;
		}
		request({
			method: 'GET',
			uri: 'http://www.skyscanner.com/dataservices/browse/v1.1/US/USD/en-US/destinations/' +  params.airport + '/US/' + params.startDate + '/' + params.endDate + '/?includequotedate=true&includemetadata=true&includecityid=false',
			json: true
		},
		function(error, response, body){
			if(!error)
			{

				var flights = BudgetTrips(body.Quotes, 200);
				flights = formatAgents(flights, body.Agents);
				flights = formatCarriers(flights, body.Carriers);
				flights = formatAirports(flights, body.Places);
				flights = getPlace(flights, body.Places);
				flights = createURL(flights, params.startDate, params.endDate);
				async.map(flights, getImage, function(err, results){
					for(var i = 0;i<results.length;i++){
						//console.log(results[i]['images'][0]);
						if(results[i]['images']){
							console.log("IMAGE!!!")
							console.log(results[i]['images'][0].display_sizes[0].uri);
							flights[i].image = results[i]['images'][0].display_sizes[0].uri;
						}
					}
					res.send(flights);
				});
				//res.send(flights);

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

//returns array of trips with price less than maxprice
var BudgetTrips = function(quotes, maxprice){
	var result = []
	for(var i = 0;i<quotes.length;i++){
		if(quotes[i].Price < maxprice){
			result.push(quotes[i]);
		}
	}
	return result;
}

var createURL = function(flights, startDate,endDate){
	for(var i = 0;i<flights.length;i++){
		var airport = flights[i].Outbound_FromStationName.split(" ");
		var airportoutput = "";
		for(var k = 0;k<airport.length;k++){
			airportoutput += airport[k] + "-";
		}
		var month = moment(startDate).format('MMMM');
		var year = moment(startDate).format('YYYY');
		var startShort = moment(startDate).format('YYMMDD');
		var endShort = moment(endDate).format('YYMMDD');
		flights[i].url = 'http://www.skyscanner.com/transport/flights/' + flights[i].Outbound_FromStationId + '/' + flights[i].Outbound_ToStationId + '/' + startShort + '/' + endShort + '/airfares-from-' + airportoutput + 'to-united-states-in-' + month + '-' + year + '.html?rtn=1&includePlusOneStops=true&browsePrice=139&age=0';
	}
	return flights;
}


var formatAgents = function(flights, agents){
	for(var i = 0;i<flights.length;i++){
		flights[i].Outbound_AgentName = idToName(flights[i].Outbound_AgentIds[0], agents, "AgentId");
		flights[i].Inbound_AgentName = idToName(flights[i].Inbound_AgentIds[0], agents, "AgentId");
	}
	return flights;

}

var formatCarriers = function(flights, carriers){
	for(var i = 0;i<flights.length;i++){
		flights[i].Outbound_CarrierName = idToName(flights[i].Outbound_CarrierIds[0], carriers, "CarrierId");
		flights[i].Inbound_CarrierName = idToName(flights[i].Inbound_CarrierIds[0], carriers, "CarrierId");
	}
	return flights
}

var formatAirports = function(flights, places){
	for(var i = 0;i<flights.length;i++){
		flights[i].Outbound_FromStationName = idToName(flights[i].Outbound_FromStationId, places, "PlaceId");
	}
	return flights;
}

var getImage = function(flight, callback){
	request.get({
		url : 'https://connect.gettyimages.com:443/v3/search/images?graphical_styles=photography&page_size=1&phrase=' 
		+ encodeURIComponent(flight.place),
		json: true,
		headers:{
			'Api-Key' : 'qk8yaxa6wa4rr9qkwg3fq8wy'
		}
	},
	function(error, response, body){
		if(!error){
			callback(null,body)
		}
		else{
			console.log("Wtf");
			callback(null,"");
		}
	});
}


var idToName = function(id, names, attr){
	for(var i = 0;i<names.length;i++){
		if(names[i][attr] == id){
			return names[i].Name;
		}
		
	}
}

var getPlace = function(flights, places){
	for(var i = 0;i<flights.length;i++){
		for(var k = 0;k<places.length;k++)
		{
			if(flights[i].Outbound_ToStationId == places[k].PlaceId){
				flights[i].place = places[k].CityName + " " + places[k].RegionId;
			}
		}
	}
	return flights;
}








