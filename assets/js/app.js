var app = angular.module('graphApp', ['chart.js','ngRoute','ngMaterial','ngResource','ngAnimate', 'ngSanitize', 'ui.bootstrap']);

app.config(['$routeProvider', '$locationProvider', 'ChartJsProvider', function($routeProvider, $locationProvider, ChartJsProvider){

	//ChartJsProvider.setOptions({ chartColors: myChartColors });
	$locationProvider.html5Mode(true);
	$routeProvider
   .when('/', {
    templateUrl: 'views/home.html',
		controller: 'appController'
    // resolve: {
    //   // I will cause a 1 second delay
    //   delay: function($q, $timeout) {
    //     var delay = $q.defer();
    //     $timeout(delay.resolve, 1000);
    //     return delay.promise;
    //   }
    // }
  })
  .when('/1', {
    templateUrl: 'views/left-sidebar.html',
		controller: 'appController'
  })
  .when('/2', {
  	templateUrl: 'views/right-sidebar.html',
		controller: 'appController'
  })
  .when('/3', {
  	templateUrl: 'views/no-sidebar.html',
		controller: 'appController'
  })
  .otherwise({
  	redirectTo: '/'
  });
}]);

app.service('CountryService', function ($resource) {
	    return $resource(encodeURI('http://api.population.io:80/1.0/countries'));///:user',{user: "@user"});
});
app.service('popService', function ($resource) {
	    return $resource(encodeURI('http://api.population.io:80/1.0/population/2015/United States/'));///:user',{user: "@user"});
});
app.controller("appController", ['$scope', '$http', 'CountryService', 'popService', function($scope, $http, CountryService, popService) {
  $scope.allCountries = [];
  $scope.defaultCountry = "United States";
  $scope.allCountries.push($scope.defaultCountry);
  $scope.pageTitle = "Population by Age and Gender";
  $scope.country = CountryService.get();
	console.log($scope.country);
  var query = popService.query();
  query.$promise.then(function(data) {
     $scope.rawdata = data;
     console.log($scope.rawdata);
     var thisLength = $scope.rawdata.length, tmpArray = [], tmpArray2 = [];

     for (i = 0; i < thisLength; i = i + 5) {
     	 	tmpArray.push($scope.rawdata[i].males);
     	 	tmpArray2.push($scope.rawdata[i].females);
     	 	$scope.labels.push(i);
     	}
    $scope.data.push(tmpArray);
    $scope.data.push(tmpArray2);
	});

  var thisCountry = $scope.defaultCountry;
  $scope.data = [], $scope.dataDetails = [];
  $scope.labels = [];
  $scope.series = [thisCountry + ' - Males', thisCountry + ' - Females'];
  $scope.title = "2016 Country Population by Age and Gender";
    	// for (var key in $scope.users) {

			var thisURL = "https://restcountries.eu/rest/v1/name/" + thisCountry;
			var newDetailData = $http.get(thisURL)
						.success(function(newDetailData) {
							$scope.dataDetails.push(newDetailData[newDetailData.length - 1]);
							console.log($scope.dataDetails[0]);
						})
						.error(function (error, status){
	            $scope.data.error = { message: error, status: status};
	            console.log("error = " + $scope.data.error.status);
	          });


  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };
  $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
  $scope.options = {
    scales: {
      yAxes: [
        {
          id: 'y-axis-1',
          type: 'linear',
          display: true,
          position: 'left'
        },
        {
          id: 'y-axis-2',
          type: 'linear',
          display: true,
          position: 'right'
        }
      ]
    }
  };

  $scope.countrySelected = function() {
    var x = document.getElementById("listCountries");

  		// thisCountry = x.options[x.selectedIndex].value;
		thisCountry = x.value;

		var thisURL = "https://restcountries.eu/rest/v1/name/" + thisCountry;
		var newDetailData = $http.get(thisURL)
					.success(function(newDetailData) {
						$scope.dataDetails.push(newDetailData[newDetailData.length - 1]);
					})
					.error(function (error, status){
            $scope.data.error = { message: error, status: status};
            console.log("error = " + $scope.data.error.status);
						$scope.dataDetails.push([]);
          });
		console.log($scope.dataDetails);

		thisYear = "2016";
		var tmpArray = [], tmpArray2 = [];
		thisURL = encodeURI("http://api.population.io:80/1.0/population/" + thisYear + "/" + thisCountry);
		var newData = $http.get(thisURL)
	  			.success(function(newData) {
            //$scope.allCountries.push(thisCountry + ' ' + thisYear);
						$scope.allCountries.push(thisCountry);
						thisLength = newData.length;
            // console.log(thisLength);
	  				for (i = 0; i < thisLength; i = i + 5) {
			    	 	// console.log($scope.users[i].males);
			    	 	tmpArray.push(newData[i].males);
			    	 	tmpArray2.push(newData[i].females);
			    	 	//console.log(newData[i].males);

    	    	}
    	    	$scope.data.push(tmpArray);
    	    	$scope.data.push(tmpArray2);
    	    	$scope.series.push([thisCountry + ' ' + thisYear + ' - Males']);
    	    	$scope.series.push([thisCountry + ' ' + thisYear + ' - Females']);
	  				//$scope.data.push(newData);
	  			})
          .error(function (error, status){
            $scope.data.error = { message: error, status: status};
            console.log($scope.data.error.status);
          });
  };
	$scope.removeCountry = function() {
  	var arrPos = $.inArray(this.thisCountry, $scope.allCountries);
  	$scope.allCountries.splice(arrPos, 1 );
  	$scope.series.splice(arrPos*2, 2 );
  	$scope.data.splice(arrPos*2, 2);
		$scope.dataDetails.splice(arrPos, 1 );
  };



}]);


app.directive('typeaheadFocus', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ngModel) {

      //trigger the popup on 'click' because 'focus'
      //is also triggered after the item selection
      element.bind('click', function () {

        var viewValue = ngModel.$viewValue;

        //restore to null value so that the typeahead can detect a change
        if (ngModel.$viewValue == ' ') {
          ngModel.$setViewValue(null);
        }

        //force trigger the popup
        ngModel.$setViewValue(' ');

        //set the actual value in case there was already a value in the input
        ngModel.$setViewValue(viewValue || ' ');
      });

      //compare function that treats the empty space as a match
      scope.emptyOrMatch = function (actual, expected) {
        if (expected == ' ') {
          return true;
        }
        return actual.indexOf(expected) > -1;
      };
    }
  };
});
