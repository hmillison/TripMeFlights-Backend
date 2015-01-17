var request = require('request');

module.exports = function (app) {

	app.get('/',function(req,res){
	  res.render('index.ejs');
	});

	app.get('/search', function(req, res){
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
				var flights = BudgetTrips(body.Quotes, 200);
				flights = formatAgents(flights, body.Agents);
				flights = formatCarriers(flights, body.Carriers);
				flights = formatAirports(flights, body.Places);
				flights = createURL(flights);
				res.send(flights);

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

var createURL = function(flights){
	for(var i = 0;i<flights.length;i++){
		var airport = flights[i].Outbound_FromStationName.split(" ");
		var airportoutput = "";
		for(var k = 0;k<airport.length;k++){
			airportoutput += airport[k] + "-";
		}
		flights[i].url = 'http://www.skyscanner.com/transport/flights/' + flights[i].Outbound_FromStationId + '/' + flights[i].Outbound_ToStationId + '/150206/150211/airfares-from-' + airportoutput + 'to-united-states-in-february-2015.html?rtn=1&includePlusOneStops=true&browsePrice=139&age=0';
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

var idToName = function(id, names, attr){
	for(var i = 0;i<names.length;i++){
		if(names[i][attr] == id){
			return names[i].Name;
		}
		
	}
}