var _ = require('lodash');
var fs = require('fs');
var csv = require('fast-csv');

var restaurantList = require('./resources/dataset/restaurants_list.json');

function changePaymentOption(restaurant){
    var payment_opt_obj = [];
    var newRestaurant = restaurant;

    // rearrange payment options
    restaurant.payment_options.forEach(function (option) {

        // Diners club and Carte Blanche are Discover cards
        if (option == 'Diners Club' || option == 'Carte Blanche') {
            if(!payment_opt_obj.includes('Discover')){
                payment_opt_obj.push('Discover');
            }
        }

        // keep AMEX / MasterCard / Visa, exclude others
        if (option != 'JCB' && option != 'Pay with OpenTable' && option != 'Cash Only' && option != 'Carte Blanche' && option != 'Diners Club') {
            if(!payment_opt_obj.includes(option)){
                payment_opt_obj.push(option);
            }
        }
    })
    
    newRestaurant.payment_options = payment_opt_obj;
    return newRestaurant
}

// counter to keep track of csv parsing
var counter = 0;
// key list to add in the main restaurant object type
var keyList = [];
// new restaurant list to save in a json file
var newRestaurantList = [];
fs.createReadStream('./resources/dataset/restaurants_info.csv')
    .pipe(csv())
    .on('data', function(data){

        // infos is successively each line of the csv file
        var infos = data[0].split(';');
        var infosObj = {};
        // first line is header
        if(counter == 0){
            keyList = infos;
        } else { // others are data
            // structure data to allow further search/ranking configuration
            keyList.forEach(function(cle, indice){
                infosObj[cle] = infos[indice];
            })


            // get corresponding restaurant
            var restaurantJoin = restaurantList.filter(function(restaurant, indice){
                return restaurant.objectID == infosObj.objectID;
            })
            if(restaurantJoin.length == 1){
                var newRestaurant = restaurantJoin[0];
            } else {
                console.log("Erreur ! Il y a une ambiguïté !")
            }

            // change payment options
            newRestaurant = changePaymentOption(newRestaurant);


            // merge objects
            newRestaurant = Object.assign(newRestaurant, infosObj);

            // push restaurant in newRestaurantList
            newRestaurantList.push(newRestaurant);
        }
        counter++;
    })
    .on('end', function(){
        fs.writeFile("newDataset.json", JSON.stringify(newRestaurantList), function(err){
            console.log(err);
        })
        console.log('Finished, newDataset.json file created');
    });
