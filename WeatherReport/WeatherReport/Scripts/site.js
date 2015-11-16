
var source, destination, weatherPoints = [], weatherInfo = [], weatherLabels = {};
var labelIndex;
var map;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
google.maps.event.addDomListener(window, 'load', function () {
    new google.maps.places.SearchBox(document.getElementById('txtSource'));
    new google.maps.places.SearchBox(document.getElementById('txtDestination'));
    directionsDisplay = new google.maps.DirectionsRenderer({ 'draggable': false });

});

function httpGetWeather(startW) {
    //startW = document.getElementById('txtSource').value;
    var url = "http://api.wunderground.com/api/36b799dc821d5836/conditions/q/";
    var urlStart = url.concat(startW + ".json");

    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = ProcessRequestWeather;
    xmlHttp.open("GET", urlStart, false);
    xmlHttp.send(null);
}

function ProcessRequestWeather() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        if (xmlHttp.responseText == "Not found") {
        }
        else {

            var data = eval("(" + xmlHttp.responseText + ")");

            var temp = data.current_observation.temp_f;
            var icon = data.current_observation.icon_url;
            var weather1 = data.current_observation.weather;
            var location = data.current_observation.display_location.full
            var lat = data.current_observation.display_location.latitude;
            var lng = data.current_observation.display_location.longitude;
            weatherLabels[labelIndex].label = temp;
            labelIndex++;
            //console.log("Calling ProcessRequest Lat: " + lat + "Lng:" + lng);
            //console.log(data);
            weatherInfo.push({ t: temp, loc: location, w: weather1, ic: icon, lt: lat, ln: lng });
            insertWeather();
        }
    }
}

function insertWeather() {
    //console.log(weatherInfo.length + " " + weatherPoints.length);
    //console.log(weatherInfo);
    //addMarker(latlngs[20]);
    if (weatherInfo.length == weatherPoints.length) {
        var wc = document.getElementById("weatherRows");
        wc.innerHTML = "";
        for (var p = 0; p < weatherInfo.length; p++) {
            wc.innerHTML += '<div class="row weatherDash">' + '<div class="col-xs-1 currentIcon" >' + '<img src="' + weatherInfo[p].ic + '"/>' + '</div>' + '<div class="col-md-offset-4 currentConditions">' + weatherInfo[p].loc + "<br/>Currently " + weatherInfo[p].t + " &deg; F<br/>" + weatherInfo[p].w + '</div>' + '</div>';
            addMarker(weatherLabels[p].latlng, weatherLabels[p].label);
            
        }
        populateEvents();
    }
    
}

function getWeather() {

    weatherInfo = [];
    weatherLabels = {};
    labelIndex = 0;
    console.log("NumberOfPts", weatherPoints.length);
    for (var p = 0; p < weatherPoints.length; p++) {
        //console.log('Calling Get '+p);
        weatherLabels[p] = { latlng: weatherPoints[p] };
        httpGetWeather(weatherPoints[p].lat() + "," + weatherPoints[p].lng());
    }
    
}

function getEvents(latlng,loc) {
    console.log("The LOCATION " + latlng+" "+loc);
    var url = "https://api.foursquare.com/v2/venues/search?categoryId=4d4b7104d754a06370d81259&client_id=ZLNCVVDMUTSIAICKT103POACTFZMR4COUZMCMB4UUN5MYA3X&client_secret=SCRJ41NA15ZHMBPSEMB115J3SBV33QTBTMUQ25CZJOBWEBKH&v=20130815&ll="+latlng;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () { ProcessRequestEvent(loc);};
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null); 
}
function ProcessRequestEvent(loc) {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        if (xmlHttp.responseText == "Not found") {
        }
        else {

            var data = eval("(" + xmlHttp.responseText + ")");
            //console.log(data);
            insertEvents(loc, data.response.venues);

        }
    }
}

function insertEvents(loc,events) {

    var er = document.getElementById("eventCols");
    
    var eventList = '<div class="row eventDash">' + '<h5 style="font-weight:900">' + loc + '</h5>' + '</div>';
    for (var e = 0; e < events.length; e++) {
        if (typeof events[e].contact.formattedPhone != 'undefined')
            ph = events[e].contact.formattedPhone;
        else
            ph = '';
            
        eventList += '<div class="row eventDash">' + '<div>' + events[e].name + '<br/>' + ph + '</div>' + '</div>';
        }
        er.innerHTML += '<div class="col-md-3 eventsDash">' + eventList + '</div>';

}
function populateEvents() {

    var er = document.getElementById("eventCols");
    er.innerHTML = "";
    console.log("Size: "+weatherInfo.length);
    for (var p = 0; p < weatherInfo.length; p++) {
        getEvents(weatherInfo[p].lt + "," + weatherInfo[p].ln, weatherInfo[p].loc);

    }
}

function addMarker(location, t) {
    //marker = new google.maps.Marker({
    //    position: location,
    //    map: map
    //});
    var mapLabel = new MapLabel({
        text: t + "℉",
        position: location,
        map: map,
        fontSize: 16,
        strokeWeight: 4,
        fontColor: '#366D80',
        strokeColor: 'white',
        align: 'right'
    });
}

function GetRoute() {
    weatherPoints = [];
    var kansas_city = new google.maps.LatLng(39.114171, -94.627457);
    var mapOptions = {
        zoom: 7,
        center: kansas_city,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var latlngs = [];
    var distance;
    var ok = [false, false];
    map = new google.maps.Map(document.getElementById('dvMap'), mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('dvPanel'));

    //*********DIRECTIONS AND ROUTE**********************//
    source = document.getElementById("txtSource").value;
    destination = document.getElementById("txtDestination").value;

    var request = {
        origin: source,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {

            directionsDisplay.setDirections(response);

            latlngs = google.maps.geometry.encoding.decodePath(response.routes[0].overview_polyline);
            console.log("Geolocations Ready!");
            ok[0] = true;
            if (ok[1] == true) {
                getSteps(distance, latlngs);
                getWeather();
            }
        }
    });


    //*********DISTANCE AND DURATION**********************//
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [source],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
    }, function (response, status) {
        if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status != "ZERO_RESULTS") {
            distance = response.rows[0].elements[0].distance.text;
            var duration = response.rows[0].elements[0].duration.text;
            var dvDistance = document.getElementById("dvDistance");
            dvDistance.innerHTML = "";
            dvDistance.innerHTML += "Distance: " + distance + "<br />";
            dvDistance.innerHTML += "Duration:" + duration;
            console.log("Distance Ready!");
            ok[1] = true;
            if (ok[0] == true) {
                getSteps(distance, latlngs);
                getWeather();
            }
        } else {
            alert("Unable to find the distance via road.");
        }
    });
}

function getSteps(distance, latlngs) {
    var steps;
    var dis = Number(distance.split(" ")[0]);
    console.log("Distance: " + dis);
    if (dis < 101) {
        steps = [0, latlngs.length - 1];
    }
    else if (dis < 1001) {
        var s1 = Math.floor(latlngs.length / 4);
        var s2 = Math.floor(s1 * 3);
        steps = [0, s1, s2, latlngs.length - 1];
    }
    else {
        steps = [];
        steps[0] = 0;
        var s = 0, i = 1;
        while (s < latlngs.length) {
            s = s + 10;
            if (s < latlngs.length)
                steps[i] = s;
            else
                steps[i] = latlngs.length - 1;
            i++;
        }

    }
    console.log("Steps Ready!");

    weatherPoints = [];

    for (var k = 0; k < steps.length; k++) {
        weatherPoints[k] = latlngs[steps[k]];
    }
}