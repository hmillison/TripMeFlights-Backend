var app = angular.module('tripme',['ngResource', 'ngAnimate']);

app.controller('SearchController', ['$scope', '$http', '$resource', '$timeout', 
function($scope, $http, $resource, $timeout){
	$scope.airport = 'DTW';
	$scope.price = 300;
	$scope.startDate = '2015-02-01';
	$scope.endDate = "2015-02-10";
	 $scope.submit = function() {
	 	$scope.results = [];

      	$http.get('/search?airport=' + this.airport + "&startDate=" + this.startDate + "&endDate=" + this.endDate + "&price=" + this.price)
      		.success(function(data){
      			for(var i = 0;i<data.length;i++)
      			{
      				$scope.results.push(data[i]);
      			}
      		});
        }
    }])


