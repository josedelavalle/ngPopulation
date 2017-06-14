var app = angular.module('graphApp', ['chart.js','ngRoute','ngMaterial','ngResource','ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ngMap']);

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
	    //return $resource(encodeURI('http://api.population.io:80/1.0/countries'));///:user',{user: "@user"});
			return $resource('assets/countries.json')
});

app.factory('getCountryDetails', function ($http) {
    return {
        get: function (thisCountry) {
            return $http.get('https://restcountries.eu/rest/v1/name/' + thisCountry);
        }
    };
});
app.factory('appFactory', function ($http, $resource) {
    return {
        getCountries: function () {
          return $resource('assets/countries.json');
        },
        getPopulation: function (thisYear, thisCountry) {
            return $http.get("http://api.population.io:80/1.0/population/" + thisYear + "/" + thisCountry);
        },
        getCountryDetails: function (thisCountry) {
            return $http.get('https://restcountries.eu/rest/v1/name/' + thisCountry);
        }
    };
});
app.controller("appController", ['$scope', '$timeout', '$window', 'CountryService', 'appFactory', 'NgMap', function($scope, $timeout, $window, CountryService, appFactory, NgMap) {
   
  defaultCountry = "United States";
  var thisCountry = defaultCountry;
  var thisYear = 2016;
  $scope.notFoundMessage = "Not Found";
  $scope.allShownCountries = [];
  
  $scope.pageTitle = "2016 Country Population by Age and Gender";
	$scope.myLinks = ["http://ngGallery.josedelavalle.com","http://ngNews.josedelavalle.com","http://josedelavalle.com"];
  $scope.country = CountryService.get();
  $scope.expanded = false;

  $scope.data = [], $scope.dataDetails = [];
  $scope.labels = [];
  $scope.series = [];
  $scope.popTotals = [];
	// console.log($scope.country);
  $scope.ageInterval = 10;
  $scope.changeInterval = function() {
    console.log('change interval', $scope.ageInterval)
    $scope.getPop();
  };
  $scope.getPop = function (thisCountry) {

    appFactory.getPopulation('2016', thisCountry).then(function (msg) {
        var tmpArray = [], tmpArray2 = [];
        $scope.allShownCountries.push(thisCountry);
        console.log('all', $scope.allShownCountries);
        console.log(msg.data);
        var totalMales = 0;
        var totalFemales = 0;
        for (i = 0; i < msg.data.length; i = i + $scope.ageInterval) {

          tmpArray.push(msg.data[i].males);
          totalMales += msg.data[i].males;
          tmpArray2.push(msg.data[i].females);
          totalFemales += msg.data[i].females;
          
        }
        totalMalesPct = totalMales / (totalMales + totalFemales) * 100;
        totalFemalesPct = totalFemales / (totalMales + totalFemales) * 100;
        if (totalMalesPct > totalFemalesPct) {
            totalMalesPct = Math.ceil(totalMalesPct);
            totalFemalesPct = Math.floor(totalFemalesPct);
        } else {
            totalMalesPct = Math.floor(totalMalesPct);
            totalFemalesPct = Math.ceil(totalFemalesPct);
        } 
        $scope.popTotals.push({males: totalMalesPct, females: totalFemalesPct});

        $scope.data.push(tmpArray);
        $scope.data.push(tmpArray2);
        pushLabels(thisCountry, thisYear);
        console.log('scope data', $scope.data);
    });
    
    
  };
  for (i = 0; i < 101; i = i + $scope.ageInterval) {
      $scope.labels.push(i);

  }
  pushLabels = function(thisCountry, thisYear) {
    $scope.series.push([thisCountry + ' ' + thisYear + ' - Males']);
    $scope.series.push([thisCountry + ' ' + thisYear + ' - Females']);
  };

  $scope.getPop(defaultCountry);

  getDetails = function(thisCountry) {
    appFactory.getCountryDetails(thisCountry).then(function (msg) {
      var found = false;
      //The United States returns two arrays the first 
      //being "territories" ie. Guam, Puerto Rico, etc.,
      
      console.log('length ' + msg.data.length);
      if (msg.data.length > 1) {
          for(i=0; i <= msg.data.length-1; i++) {
            console.log('thiscountry' + thisCountry);
            console.log('msgdata' + msg.data[i].name);
            if(thisCountry == msg.data[i].name) {
              $scope.dataDetails.push(msg.data[i]);
              found = true;
              console.log('found');
            }
          }
          if (!found) {
            $scope.dataDetails.push(msg.data[1]);
          }

      } else {
        $scope.dataDetails.push(msg.data[0]);
      } 
      console.log('datadetails', $scope.dataDetails);
    }).catch (function() {
      console.log("======ERROR=======");
      $scope.dataDetails.push({name: thisCountry, capital: "Not Found", area: "Not Found", population: "Not Found"})
    });
  };
  
  getDetails(thisCountry);

  var triggerResize = function () {
    var evt = $window.document.createEvent('UIEvents'); 
    evt.initUIEvent('resize', true, false, $window, 0); 
    $window.dispatchEvent(evt);
  };

  $scope.onMapLoaded = function () {
    console.log('map loaded');
    var self = this;
    triggerResize();
    NgMap.getMap($scope.dataDetails.length - 1).then(function(map) {
      map.setOptions({draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true});
    });
  };

  $scope.onClick = function (points, evt) {
    // console.log(points, evt);
  };
  $scope.colors = ["#E8E2A0", "#EB937B", "#81BBC2", "#ED9FE5", "#9DEA98", "#A984E3", "#EEAA6F", "#8EECE5", "#AD76A0", "#94CCE5"];
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

  $scope.getZoom = function (area) {
    var zoom = Math.floor(area / 3000000);
    if (zoom == 0) zoom = 5; else if (zoom == 1) zoom = 4; else zoom = 3;
    return zoom;
  };

  $scope.countrySelected = function() {
    
		thisCountry = this.selected;
    
  
    this.selected = "";
    
    //make sure we haven't added this before
    if ($scope.allShownCountries.indexOf(thisCountry) < 0) {
      
      $scope.getPop(thisCountry);
  		getDetails(thisCountry);

  		
    }

  };

	$scope.removeCountry = function(arrPos) {
  	$scope.allShownCountries.splice(arrPos, 1 );
    console.log('all', $scope.allShownCountries);

  	$scope.series.splice(arrPos*2, 2 );
  	$scope.data.splice(arrPos*2, 2);
		$scope.dataDetails.splice(arrPos, 1 );
    $scope.popTotals.splice(arrPos, 1 );
  };

  $scope.removeAllCountries = function() {
    $scope.data = [];
    $scope.dataDetails = [];
    $scope.allShownCountries = [];
    $scope.series = [];
  };

  $scope.hideKeyboard = function() {
     document.activeElement.blur();
     var inputs = document.querySelectorAll('input');
     for(var i=0; i < inputs.length; i++) {
      inputs[i].blur();
     }
    };
  

  $scope.isMobile = function() {
    if(window.innerWidth <= 800 && window.innerHeight <= 600) {
      return true; 
    } else { 
      return false; 
    }
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
