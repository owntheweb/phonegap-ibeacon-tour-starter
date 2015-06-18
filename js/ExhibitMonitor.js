/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
function ExhibitMonitor() {

    //When app is active, track the distance from iBeacons,
    //activating content for the closest iBeacon.
    //Range as many iBeacons at a time as you like, but no
    //more than 4,294,836,225 at a time. xD
    //??? What is the energy requirments for ranging a bajilion iBeacons?
    this.rangeBeacons = [
        {
            identifier:'onyx1',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:17163
        },
        {
            identifier:'onyx2',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:16330
        },
        {
            identifier:'onyx3',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:212,
            minor:64096
        },
        {
            identifier:'onyx4',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:25553
        },
        {
            identifier:'onyx5',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:17671
        },
        {
            identifier:'onyx6',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:27164
        },
        {
            identifier:'onyx7',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:16351
        },
        {
            identifier:'onyx8',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:212,
            minor:65357
        },
        {
            identifier:'onyx9',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:26374
        },
        {
            identifier:'onyx10',
            uuid:'20CAE8A0-A9CF-11E3-A5E2-0800200C9A66',
            major:213,
            minor:2617
        }
    ];


}

//log messages to the app screen, mostly for testing
ExhibitMonitor.prototype.logToDom = function(message) {
    document.getElementById('domLog').innerHTML = message; //pretty dom huh? Need to explore a console-like solution
};

//handle location manager events for an iBeacon when monitoring distance from iBeacon
ExhibitMonitor.prototype.setDeligate = function() {
    var delegate = new cordova.plugins.locationManager.Delegate();

    //talked about as "ranging"
    delegate.didRangeBeaconsInRegion = function (pluginResult) {
        var prox;

        /*
        //update visuals for ranged iBeacon
        for(i=0; i<this.rangeBeacons.length; i++) {
        	if(pluginResult.region.uuid == this.rangeBeacons[i].uuid && pluginResult.region.major == this.rangeBeacons[i].major && pluginResult.region.minor == this.rangeBeacons[i].minor) {
        		//set RSSI value
        		this.rangeBeacons[i].rssi = pluginResult.beacons[0].rssi;
        		document.getElementById('rBeaconRSSI' + this.rangeBeacons[i].i).innerHTML = pluginResult.beacons[0].rssi;

        		//set range/range label values
        		switch(pluginResult.beacons[0].proximity) {
        			case 'ProximityImmediate':
        				prox = 'immediate';
        				break;
        			case 'ProximityNear':
        				prox = 'near';
        				break;
        			case 'ProximityFar':
        				prox = 'far';
        				break;
        			case 'ProximityUnknown':
        				prox = 'unknown';
        				break;
        			default:
        				prox = 'unknown';
        		}

        		this.rangeBeacons[i].prox = prox;
        		document.getElementById('rBeaconRangeLabel' + this.rangeBeacons[i].i).innerHTML = prox.toUpperCase();
        		document.getElementById('rBeaconRange' + this.rangeBeacons[i].i).className = "col col-range range-" + prox;

        		//show closest exhibit (iBeacon)
        		this.featureClosestExhibit();

        		//update graph with new data
        		try {
        			//this.logToDom(this.rangeBeacons[i].rssi + " : " + pluginResult.beacons[0].accuracy + " : " + this.rangeBeacons[i].i);
        			this.signalGraph.pushRangeData(this.rangeBeacons[i].rssi, pluginResult.beacons[0].accuracy, this.rangeBeacons[i].i);
        		} catch(err) {
        			this.logToDom(err);
        		}

        		break;
        	}
        }
        */

        //logToDom('[DOM] didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
    }.bind(this);

    cordova.plugins.locationManager.setDelegate(delegate);

    // required in iOS 8+
    //!!! might be nice to show a message about the "this app wishes to monitor you location" first
    //we're not using GPS, but it's still location/proximity based
    cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
};

//feature the closest detected exhibit in the "action bar"
//Think about not swapping full content to closest exhibit as people may want to absorb
//content in the app while continuing to wander around (reason for action bar).
ExhibitMonitor.prototype.featureClosestExhibit = function() {
	/*
    var i;
	var closest = {uuid:'none', rssi:-999}; //none to be found to start
	for(i=0; i<this.rangeBeacons.length; i++) {
		if(this.rangeBeacons[i].prox != "unknown") {
			if(this.rangeBeacons[i].rssi > closest.rssi) {
				closest = this.rangeBeacons[i];
			}
		}
	}

	//only update markup if closest iBeacon not closest previously
	if(closest.closest == false) {
		for(i=0; i<this.rangeBeacons.length; i++) {
			if(closest.i == i) {
				document.getElementById('rBeaconStar' + this.rangeBeacons[i].i).className = "col col-star star-active";
			} else {
				document.getElementById('rBeaconStar' + this.rangeBeacons[i].i).className = "col col-star star-not";
			}
		}
	}
    */
};

// Start monitoring iBeacon ranges
ExhibitMonitor.prototype.startRangingBeacons = function() {
    var i;

    /*
    for(i=0; i<this.rangeBeacons.length; i++) {
        this.rangeBeacons[i].i = i; //set i for display update purposes for now (instead of "redrawing" everything for now)
        this.rangeBeacons[i].rssi = -999; //start with an impossibly low signal strength when starting to detect closest beacons later
        this.rangeBeacons[i].prox = 'unknown'; //we don't know proximity yet until it is measured
        this.rangeBeacons[i].closest = false; //closest beacon gets a star

        //set iBeacon's region
        this.rangeBeacons[i].region = new cordova.plugins.locationManager.BeaconRegion(this.rangeBeacons[i].identifier, this.rangeBeacons[i].uuid, this.rangeBeacons[i].major, this.rangeBeacons[i].minor);

        //start ranging the iBeacon!
        cordova.plugins.locationManager.startRangingBeaconsInRegion(this.rangeBeacons[i].region)
            .fail(console.error)
            .done();
    }
    */
};

//deviceready event handler
ExhibitMonitor.prototype.onDeviceReady = function() {
    try {
        /*
        //range
        this.createRangeListMarkup();
        this.startRangingBeacons();


        //manage iBeacon ranging events
        this.setDeligate();
        */
    } catch(err) {
        alert(err);
        this.logToDom(err.message);
    }  

};

