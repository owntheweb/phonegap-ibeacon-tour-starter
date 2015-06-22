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
    //where the data comes from
    this.dataURL = 'http://christopherstevens.cc/app/api/v1/poi/all';
    
    //data pulled from the website, stored in an array for now
    //!!! move this to a data class and store data locally for offline use!
    //!!! It's a mobile app for crying out loud!
    this.data = [];

    //for now, data will be restructured for clearity and centered around iBeacons here
    //When app is active, track the distance from iBeacons,
    //activating content for the closest iBeacon.
    //Range as many iBeacons at a time as you like, but no
    //more than 4,294,836,225 at a time. xD
    //??? What is the energy requirments for ranging a bajilion iBeacons?
    this.rangeBeacons = []; 

    //closest iBeacon data
    //none to be found to start
    this.closest = {closest: true, rssi: -999}; //visuals won't update if this continues to be the "closest"
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

        //update visuals for ranged iBeacon
        for(i=0; i<this.rangeBeacons.length; i++) {

            //!!! ///////////////////////////////////////////////////////////////////
            //!!! Android is making it to here with good values (YAY iBeacons work!),
            //!!! but never into the if() below as iOS does... What's different?
            //!!! ///////////////////////////////////////////////////////////////////
            
            //!!! tests:
            var tmpMsg = '';
            var toType = function(obj) {
                return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
            }

            tmpMsg += toType(this.rangeBeacons[i].uuid) + ":" + toType(this.rangeBeacons[i].major) + ":" + toType(this.rangeBeacons[i].minor;
            tmpMsg += 'didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult);
            this.logToDom(tmpMsg);
            //!!! end tests

            if(pluginResult.region.uuid == this.rangeBeacons[i].uuid && pluginResult.region.major == this.rangeBeacons[i].major && pluginResult.region.minor == this.rangeBeacons[i].minor) {
        		

                

                //set RSSI value
        		this.rangeBeacons[i].rssi = pluginResult.beacons[0].rssi;

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

        		break;
        	}
        }

        //show closest iBeacon exhibit
        this.featureClosestExhibit();

        //this.logToDom('[DOM] didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
    }.bind(this);

    cordova.plugins.locationManager.setDelegate(delegate);

    // required in iOS 8+
    //!!! might be nice to show a message about the "this app wishes to monitor you location" first
    //we're not using GPS, but it's still location/proximity based
    cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
};

//feature the closest detected exhibit in the "action bar"
//Think about not swapping full content to closest exhibit right away as people may want to absorb
//content in the app while continuing to wander around (reason for action bar).
ExhibitMonitor.prototype.featureClosestExhibit = function() {
    var i;
	for(i=0; i<this.rangeBeacons.length; i++) {
		if(this.rangeBeacons[i].prox != "unknown") {
			if(this.rangeBeacons[i].rssi > this.closest.rssi) {
				this.closest = this.rangeBeacons[i];
			}
		}

	}

	//only update markup if closest iBeacon not closest previously
	if(this.closest.closest == false) {
		//reset closest values
        //!!! check this, might not be needed
        for(i=0; i<this.rangeBeacons.length; i++) {
            this.rangeBeacons[i].closest = false;
		}

        this.closest.closest = true;

        //update "action bar"
        //!!! should trigger a sweet CSS3 transition here when nearing new exhibit...
        document.getElementById('action-bar').className = ""; //removes initial .hidden class
        document.getElementById('action-thumb').innerHTML = this.closest.content.thumbImg;
        document.getElementById('action-title').innerHTML = this.closest.content.title;

	}

};

// Start monitoring iBeacon ranges
ExhibitMonitor.prototype.startRangingBeacons = function() {
    var i;

    for(i=0; i<this.rangeBeacons.length; i++) {
        //this.rangeBeacons[i].i = i; //set i for display update purposes for now (instead of "redrawing" everything)

        //set iBeacon's region
        this.rangeBeacons[i].region = new cordova.plugins.locationManager.BeaconRegion(this.rangeBeacons[i].identifier, this.rangeBeacons[i].uuid, this.rangeBeacons[i].major, this.rangeBeacons[i].minor);

        //start ranging the iBeacon!
        cordova.plugins.locationManager.startRangingBeaconsInRegion(this.rangeBeacons[i].region)
            .fail(console.error)
            .done();
    }
};

//Get exhibit and iBeacon data from the D8 website
//!!! This should be moved into its own Data class or something
//!!! It would be better to act like a mobile app and cache data for offline use. ;D
//This will get us started for now...
ExhibitMonitor.prototype.getData = function() {
    var i, ib;
    var request = new XMLHttpRequest();
    request.open('GET', this.dataURL, true);

    this.logToDom('requesting website data');

    request.onload = function() {
      this.logToDom('data loaded');

      if (request.status >= 200 && request.status < 400) {

        //assign data
        this.data = JSON.parse(request.responseText);

        //rearange data for increased clearity, centered around iBeacons
        for(i=0; i<this.data.length; i++) {
            
            ib = {
                identifier: '',
                uuid: '',
                major: '',
                minor: '',
                rssi: -999, //start with an impossibly low signal strength when starting to detect closest beacons later
                prox: 'unknown', //we don't know proximity yet until it is measured
                closest: false, //closest beacon gets featured
                content: {
                    title: '',
                    featureImg: '',
                    thumbImg: '',
                    description: '',
                    youTubeIDs: []
                }
            };

            if(this.data[i].hasOwnProperty('field_ibeacon_identifier')) {
                ib.identifier = this.data[i].field_ibeacon_identifier;
            }

            if(this.data[i].hasOwnProperty('field_ibeacon_uuid')) {
                ib.uuid = this.data[i].field_ibeacon_uuid;
            }

            if(this.data[i].hasOwnProperty('field_ibeacon_major_version')) {
                ib.major = this.data[i].field_ibeacon_major_version;
            }

            if(this.data[i].hasOwnProperty('field_ibeacon_minor_version')) {
                ib.minor = this.data[i].field_ibeacon_minor_version;
            }

            if(this.data[i].hasOwnProperty('title')) {
                ib.content.title = this.data[i].title;
            }

            if(this.data[i].hasOwnProperty('field_feature_image')) {
                ib.content.featureImg = this.data[i].field_feature_image;
            }

            if(this.data[i].hasOwnProperty('field_feature_image_1')) {
                ib.content.thumbImg = this.data[i].field_feature_image_1; //!!! consider preloading this image
            }

            if(this.data[i].hasOwnProperty('body')) {
                ib.content.description = this.data[i].body;
            }

            if(this.data[i].hasOwnProperty('field_youtube_video_ids')) {
                ib.content.youTubeIDs = this.data[i].field_youtube_video_ids.split(',');
            }

            this.rangeBeacons.push(ib);

        }

        this.startRangingBeacons();

        //manage iBeacon ranging events
        //!!! check order: likely need to move before this.startRangingBeacons(); ?
        this.setDeligate();
      } else {
        //!!! need to allow for retry, don't kill app here
        this.logToDom('There was an error when trying to load the exhibit data. Tell the app developers!');
        alert('There was an error when trying to load the exhibit data. Tell the app developers!');
      }
    }.bind(this);

    request.onerror = function() {
      // There was a connection error of some sort
      //!!! now what? Don't kill app now...
       this.logToDom('There was a connection error of some sort');
       alert('There was a connection error of some sort');
    };

    request.send();
};

ExhibitMonitor.prototype.displayClosestExhibit = function() {
    var i, vidHTML = '', first = true;

    //clear content
    document.getElementById('exhibit-feature-img').innerHTML = '';
    document.getElementById('exhibit-title').innerHTML = '';
    document.getElementById('exhibit-description').innerHTML = '';
    document.getElementById('exhibit-videos').innerHTML = '';

    //!!! validate, then:
    //populate content
    //!!! would be nice to transition this in yah?
    document.getElementById('exhibit-feature-img').innerHTML = this.closest.content.featureImg;
    document.getElementById('exhibit-title').innerHTML = this.closest.content.title;
    document.getElementById('exhibit-description').innerHTML = this.closest.content.description;
    

    for(i=0; i<this.closest.content.youTubeIDs.length; i++) {
        if(this.closest.content.youTubeIDs[i] != "") { //D8 is throwing in a lot of blank ones at the end
            //!!! uh oh, template in the code...
            if(first == true) {
                vidHTML += '<h2>Videos</h2>';
                first = false;
            }

            //!!! uh oh, template in the code...
            vidHTML += '<div class="flex-video">';
            vidHTML += '    <iframe width="420" height="315" frameborder="0" allowfullscreen="" src="https://www.youtube.com/embed/' + this.closest.content.youTubeIDs[i] + '"></iframe>';
            vidHTML += '</div>';
        }
    }

    document.getElementById('exhibit-videos').innerHTML = vidHTML;
    
}

//deviceready event handler
ExhibitMonitor.prototype.onDeviceReady = function() {
    try {

        //nav events
        document.getElementById('action-bar').onclick = function() { this.displayClosestExhibit(); }.bind(this);
        document.getElementById('action-thumb').onclick = function() { this.displayClosestExhibit(); }.bind(this);
        document.getElementById('action-nearby').onclick = function() { this.displayClosestExhibit(); }.bind(this);
        document.getElementById('action-title').onclick = function() { this.displayClosestExhibit(); }.bind(this);

        this.getData();
    } catch(err) {
        this.logToDom(err);
        alert(err);
        this.logToDom(err.message);
    }  

};

