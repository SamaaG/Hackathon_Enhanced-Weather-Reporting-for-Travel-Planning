
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

function httpGet(startW) {
    //startW = document.getElementById('txtSource').value;
    var url = "http://api.wunderground.com/api/36b799dc821d5836/conditions/q/";
    var urlStart = url.concat(startW + ".json");

    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = ProcessRequest;
    xmlHttp.open("GET", urlStart, false);
    xmlHttp.send(null);
}

function ProcessRequest() {
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
        document.getElementById("weatherRows").innerHTML = "";
        for (var p = 0; p < weatherInfo.length; p++) {
            document.getElementById("weatherRows").innerHTML += '<div class="row weatherDash">' + '<div class="col-xs-1 currentIcon" >' + '<img src="' + weatherInfo[p].ic + '"/>' + '</div>' + '<div class="col-md-offset-4 currentConditions">' + weatherInfo[p].loc + "<br/>Currently " + weatherInfo[p].t + " &deg; F<br/>" + weatherInfo[p].w + '</div>' + '</div>';
            addMarker(weatherLabels[p].latlng, weatherLabels[p].label);
        }


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
        httpGet(weatherPoints[p].lat() + "," + weatherPoints[p].lng());

    }



    //$http.get(urlStart).success(function (data) {
    //    console.log(data);
    //    temp = data.current_observation.temp_f;
    //    icon = data.current_observation.icon_url;
    //    weather1 = data.current_observation.weather;
    //    console.log(temp);
    //    document.getElementById("conds1").innerHTML = "Currently " + temp + " &deg; F and " + weather1 + "";
    //    document.getElementById("currentIcon1").innerHTML = "<img src='" + icon + "'/>"

    //})
    //function httpGet(urlStart) {
    //    var xmlHttp = new XMLHttpRequest();
    //    xmlHttp.open("GET", urlStart, false); // false for synchronous request
    //    xmlHttp.send(null);
    //    return xmlHttp.responseText;
    //}

    //$http.get(urlEnd).success(function (data) {
    //    console.log(data);
    //    temp = data.current_observation.temp_f;
    //    icon = data.current_observation.icon_url;
    //    weather1 = data.current_observation.weather;
    //    console.log(temp);
    //    document.getElementById("conds2").innerHTML = "Currently " + temp + " &deg; F and " + weather1 + ""
    //    document.getElementById("currentIcon2").innerHTML = "<img src='" + icon + "'/>"

    //})
};

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
        fontColor: '#5ba0ab',
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