var app = angular.module('TechTest', ['ngSanitize']);

app.factory('geolocFactory', ['$q', function($q){
    return {
        getLoc : function(){
            var defer = $q.defer();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    defer.resolve(position);
                }, function(error) {
                    defer.reject();
                },{timeout:5000});
            }else{
                defer.reject();
            }
            return defer.promise;
        }
    }
}])

app.controller('searchCtrl', ['$scope', 'geolocFactory',  function($scope, geolocFactory){
    var client = algoliasearch('Z3N9VYM887', '963a9ed4ec8caacd0a4eb7e2b7f22ee8');
    var hitsPerPage = 10;
    var geoloc = {};

    $scope.helper = algoliasearchHelper(client, 'restaurants', {
        disjunctiveFacets: ['food_type', 'payment_options'],
        hitsPerPage: hitsPerPage
    });

    geolocFactory.getLoc().then(function(loc){
        geoloc['lat'] = loc.coords.latitude;
        geoloc['lng'] = loc.coords.longitude;

        $scope.helper.setQueryParameter('aroundLatLng', geoloc.lat+','+geoloc.lng)
            .search();
    }, function(){
        $scope.helper.setQueryParameter('aroundLatLngViaIP', true)
            .search();
    })



    $scope.$watch('searchbox', function(query){
        $scope.helper.setQuery(query).search();
    });

    $scope.helper.on('result', function(content){
        $scope.$apply(function() {
            $scope.content = content;
            $scope.food_types = content.getFacetValues('food_type', {sortBy: ['isRefined:desc' ,'count:desc' ,'name:asc']});
            $scope.payment_options = content.getFacetValues('payment_options', {sortBy: ['isRefined:desc' ,'count:desc' ,'name:asc']});
        });
        console.log(content);
    });

    $scope.toggleRefinement = function(name, type){
        $scope.helper.toggleRefinement(type, name)
            .search();
    };

    $scope.getStarRatingPercentage = function(starCount) {
        return 20*starCount+'%';
    };

    $scope.showMore = function(){
        hitsPerPage += 10;
        $scope.helper.setQueryParameter('hitsPerPage', hitsPerPage)
            .search();
    }
}]);