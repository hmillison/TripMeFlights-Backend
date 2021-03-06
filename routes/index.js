var request = require('request');
var moment = require('moment');
var async = require('async');


module.exports = function (app) {

	app.get('/',function(req,res){
	  res.sendfile('./public/views/index.html')
	});

	app.get('/search', function(req, res){
		var params = {
			"airport" : "DTW",
			"startDate" : "2015-03-01",
			"endDate" : "2015-03-07",
			"price" : 300,
			"dest" : "US",
			"simple" : true,
			"filterSpirit" : "false"
		};
		// var months = [
		// 	month['Jan']
		// ]
		if(req.query.airport){
			params.airport = req.query.airport;
		}
		if(req.query.startDate && req.query.startDate != null){
			params.startDate = req.query.startDate;
		}
		if(req.query.endDate){
			params.endDate = req.query.endDate;
		}
		if(req.query.price){
			params.price = req.query.price;
		}
		if(req.query.dest){
			params.dest = req.query.dest
		}
		if(req.query.simple){
			params.simple = req.query.simple;
		}
		if(req.query.filterSpirit){
			params.filterSpirit = req.query.filterSpirit;
		}
		var url =  'http://www.skyscanner.com/dataservices/browse/v1.1/US/USD/en-US/destinations/' +  params.airport + '/' 
		+ params.dest + '/' + params.startDate + '/' + params.endDate + '/?includequotedate=true&includemetadata=true&includecityid=false';
		console.log(url);
		request({
			method: 'GET',
			uri: url,
			json: true
		},
		function(error, response, body){
			if(!error)
			{
				var flights = BudgetTrips(body.Quotes, params.price);
				console.log(flights.length + " flights found");
				flights = formatAgents(flights, body.Agents);
				console.log(params.filterSpirit)
				flights = formatCarriers(flights, params.filterSpirit, body.Carriers);
				flights = formatAirports(flights, body.Places);
				flights = getPlace(flights, body.Places);
			    flights = createURL(flights, params.startDate, params.endDate);
				flights = formatJSON(flights)
				if(params.simple == true){
					flights.sort(compare);
					res.send(flights);
				}
				else{
					async.mapLimit(flights, 2, getImage, function(err, results){
						var serialize = "";
						

						for(var i = 0;i<results.length;i++){
								//console.log(results[i]['images'][0]);
								//console.log(flights[i].Outbound_ToStationId);
								//console.log(results[i].images);
								if(result[i].images){
									serialize += results[i].images[0].id + ",";
									flights[i].imageId = results[i].images[0].id;
								}
							
						}
						request.get({
								url : 'https://connect.gettyimages.com:443/v3/images/' + encodeURIComponent(serialize) + '?fields=display_set',
								json : true,
								headers:{
								'Api-Key' : 'qk8yaxa6wa4rr9qkwg3fq8wy'
								}
							},
								function(error, response, body){
									for(var i = 0;i<flights.length;i++){
										for(var k = 0;k<body['images'].length;k++){
											if(body['images'][k].id == flights[i].imageId){
												flights[i].image = body['images'][k].display_sizes[0].uri;
											}
										}
									}
									flights.sort(compare);
									res.send(flights);
								});
					});
				}
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
		flights[i].startDate = moment(startDate).format('MMM DD, YYYY');
		flights[i].endDate = moment(endDate).format('MMM DD, YYYY');
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

var formatCarriers = function(flights, filterSpirit, carriers){
	for(var i = 0;i<flights.length;i++){
		flights[i].Outbound_CarrierName = idToName(flights[i].Outbound_CarrierIds[0], carriers, "CarrierId");
		flights[i].Inbound_CarrierName = idToName(flights[i].Inbound_CarrierIds[0], carriers, "CarrierId");
		if(filterSpirit == "true" && (flights[i].Outbound_CarrierName === "Spirit Airlines" ||  flights[i].Inbound_CarrierName === "Spirit Airlines")){
			console.log("flight filtered");
			flights.splice(i,1);
		}
	}
	return flights
}

var formatAirports = function(flights, places){
	for(var i = 0;i<flights.length;i++){
		flights[i].price = flights[i].Price;
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

var formatJSON = function(flights){
	var result = [];
	var obj = {};
	for(var i = 0;i<flights.length;i++){
		obj = { 
			"price" : Math.round(flights[i].price),
			"city" : flights[i].place,
			"airportDEST" : flights[i].Outbound_ToStationId,
			"airportFROM" : flights[i].Outbound_FromStationId,
			"startDate" : flights[i].startDate,
			"endDate" : flights[i].endDate,
			"url" : flights[i].url,
			"airline" : flights[i].Outbound_CarrierName
		}
		
		if(obj.airline != undefined){
			result.push(obj);
		};

	}
	return result;
}

var compare = function(a,b) {
  if (a.price < b.price)
     return -1;
  if (a.price > b.price)
    return 1;
  return 0;
}





