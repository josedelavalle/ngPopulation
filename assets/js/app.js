var app = angular.module('graphApp', ['chart.js','ngRoute','ngMaterial','ngResource','ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ngMap']);

app.config(['$routeProvider', '$locationProvider', 'ChartJsProvider', function($routeProvider, $locationProvider, ChartJsProvider){

	//ChartJsProvider.setOptions({ chartColors: myChartColors });
	$locationProvider.html5Mode(true);
	$routeProvider
   .when('/', {
    templateUrl: 'views/home.html'
  })
  .when('/1', {
    templateUrl: 'views/left-sidebar.html',
  })
  .when('/2', {
  	templateUrl: 'views/right-sidebar.html'
  })
  .when('/3', {
  	templateUrl: 'views/no-sidebar.html'
  })
  .otherwise({
  	redirectTo: '/'
  });
}]);

app.factory('appFactory', function ($http, $resource) {
    return {
        getCountries: function () {
          //return $http.get('http://api.population.io:80/1.0/countries');
          return $http.get('assets/countries.json')
        },
        getPopulation: function (thisYear, thisCountry) {
            var url = "http://api.population.io:80/1.0/population/" + thisYear + "/" + thisCountry;
            console.log(url);
            return $http.get(url);
        },
        getCountryDetails: function (thisCountry) {
            return $http.get('https://restcountries.eu/rest/v1/name/' + thisCountry);
        },
    };
});
app.controller("appController", ['$scope', '$timeout', '$window', 'appFactory', 'NgMap', function($scope, $timeout, $window, appFactory, NgMap) {
   
  defaultCountry = "United States";
  $scope.searchCountry = defaultCountry;
  var thisCountry = defaultCountry;
  var d = new Date();
  // used for max of input box
  $scope.currentYear = d.getFullYear();

  $scope.searchYear = $scope.currentYear;
  $scope.popData = [];
  $scope.notFoundMessage = "Not Found";
  $scope.allShownCountries = [];
  
  $scope.pageTitle = "Country Populations by Year, Age, and Gender";
	$scope.myLinks = ["http://ngGallery.josedelavalle.com","http://ngNews.josedelavalle.com","http://josedelavalle.com"];
  appFactory.getCountries().then(function(res) {

    $scope.countries = res.data.countries.filter(x => x.toUpperCase() != x);
    //console.log('----got countries', $scope.countries)
  });
  
  $scope.expanded = false;
  $scope.toggleExpanded = function() {
    $scope.expanded = !scope.expanded;
    console.log($scope.expanded);
  }
  $scope.data = [], $scope.dataDetails = [];
  $scope.labels = [];
  $scope.series = [];
  $scope.popTotals = [];
	// console.log($scope.country);
  $scope.ageInterval = 5;
  $scope.changeInterval = function() {
    console.log('change interval', $scope.ageInterval);
    getPop();
  };

  $scope.setYear = function() {
    console.log(this.searchYear);
    $scope.searchYear = this.searchYear
  }
  var getPop = function (thisCountry) {

    appFactory.getPopulation($scope.searchYear, thisCountry).then(function (msg) {
        var tmpArray = [], tmpArray2 = [];
        $scope.allShownCountries.push(thisCountry);
        //console.log('all', $scope.allShownCountries);
        console.log('got ' + $scope.searchYear + ' ' + thisCountry + ' data', msg.data);
        $scope.popData.push(msg.data);
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
        pushLabels(thisCountry, $scope.searchYear);
        console.log('scope data', $scope.data);

    });
    
    
  };
  for (i = 0; i < 101; i = i + $scope.ageInterval) {
      $scope.labels.push(i);

  }
  var pushLabels = function(thisCountry, thisYear) {
    $scope.series.push([thisCountry + ' ' + thisYear + ' - Males']);
    $scope.series.push([thisCountry + ' ' + thisYear + ' - Females']);
  };

  getPop(defaultCountry);

  getDetails = function(thisCountry) {
    appFactory.getCountryDetails(thisCountry).then(function (msg) {
      var found = false;
      //The United States returns two arrays the first 
      //being "territories" ie. Guam, Puerto Rico, etc.,
      msg.data.forEach(function(obj) {
        obj.year = $scope.searchYear;
      });
      
      if (msg.data.length > 1) {
          for(i=0; i <= msg.data.length-1; i++) {
            if(thisCountry == msg.data[i].name) {
              $scope.dataDetails.push(msg.data[i]);
              found = true;
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


  $scope.getTotal = function(i) {
    return $scope.popData[i].reduce( function(a, b){
        return a + b['total'];
    }, 0);
  };

  $scope.onMapLoaded = function (item) {
    console.log('map loaded', item);
    var self = this;
    triggerResize();
    NgMap.getMap({id: 'map-' + item.alpha2Code}).then(function(map) {
      map.setOptions({draggable: false, zoomControl: true, scrollwheel: false, disableDoubleClickZoom: true});
      map.setCenter({lat: item.latlng[0], lng: item.latlng[1]});
      map.getCenter();
      
    });
  };

  $scope.headerMapLoaded = function() {
    
    NgMap.getMap({id: 'header-map'}).then(function(map) {
      console.log('header map loaded', map)
      map.setCenter({lat: 20, lng: 0});
      map.getCenter();
    });
  };

  $scope.clearCountry = function() {
    $scope.searchCountry = "";
  }
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
    //console.log('zoom', zoom);
    if (zoom == 0) if (area < 1000) zoom = 10; else zoom = 5; else if (zoom == 1) zoom = 4; else zoom = 3;
    return zoom;
  };

  $scope.countrySelected = function(thisCountry) {
    
    if (!thisCountry) return null;
  
    //this.searchCountry = "";
    
    //make sure we haven't added this before
    //if ($scope.allShownCountries.indexOf(thisCountry) < 0) {
      
      getPop(thisCountry);
  		getDetails(thisCountry);
      //$('#chart-section').goTo();
  		
    //}
    
    $scope.hideKeyboard();
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


  $scope.getCountries = function(searchString) {
    if (searchString != ' ') {
      var tempArr = [];
      for (x = 0; x < $scope.countries.length; x++) {
        if ($scope.countries[x].toLowerCase().indexOf(searchString.toLowerCase()) >= 0 && $scope.countries[x].toUpperCase() != searchString) {
          tempArr.push($scope.countries[x]);
        }
      }
      return tempArr;
    } else {
      return $scope.countries;
    }
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
      element.bind('click', function (e) {
        var viewValue = ngModel.$viewValue;

        //restore to null value so that the typeahead can detect a change
        if (ngModel.$viewValue == ' ') {
          ngModel.$setViewValue(null);
        }

        //force trigger the popup
        ngModel.$setViewValue(' ');

        //set the actual value in case there was already a value in the input
        //ngModel.$setViewValue(viewValue || ' ');
        ngModel.$render();
        e.preventDefault();
        scope.$apply();
        console.log(ngModel);
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

app.filter('unique', function() {

  return function (arr, field) {
    var o = {}, i, l = arr.length, r = [];
    for(i=0; i<l;i+=1) {
      o[arr[i][field]] = arr[i];
    }
    for(i in o) {
      r.push(o[i]);
    }
    return r;
  };
})
