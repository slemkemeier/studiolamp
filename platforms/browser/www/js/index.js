

// Heavily based on Bluetooth Low Energy Lock (c) 2014-2015 Don Coleman
// See: https://github.com/MakeBluetooth/ble-lock/blob/master/phonegap/www/js/index.js

var DEVICE_UUID = '11F36C6C-F85E-88D6-0AF3-8A44E0B723A8';
var SERVICE_UUID = 'FE84';
var WRITE_UUID = '2d30c083-f39f-4ce6-923f-3484ea480596';
var READ_UUID = '2d30c082-f39f-4ce6-923f-3484ea480596';
var counter = 1;

//******   Utility functions (not used here yet) ******
function stringToArrayBuffer(str) {
    // assuming 8 bit bytes
    var ret = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
        ret[i] = str.charCodeAt(i);
        console.log(ret[i]);
    }
    return ret.buffer;
}
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}


//******   Actual Application Class/Logic ******

// Note:   Calls to object methods use it's variable name (i.e., app.) rather than
//         "this".  JavaScript's "this" variable doesn't follow the same scope/value
//         rules as in less dynamic languages.  (The "this" is variable dynamically
//         refers to the object that calls code rather than the object in which the "this"
//         is used.  For programmers used to other languages the behavior of "this" in
//         callbacks is often unexpected. To avoid confusion and ambiguity, "this" isn't
//         used at all here.

// Naming Conventions used here:
//   User Interface:
//     Functions that update the user interface or process user interface events start with "ui"
//   Event Handlers:
//     Any code that "responds to an event" has a name that includes the word "on" or "On".
//     Functions that begin with "bleOn" are for BLE based events.
//     Functions that begin with "uiOn" are for user interface events (buttons/touches)

// BLE Object function documentation can be found at:
// https://github.com/don/cordova-plugin-ble-central#api

var app = {

    // Initialized the app. Hide content / etc.
    initialize: function() {
        console.log("initialize");

        // Do initial screen configuration.
        // This can be done here because this file is loaded from the HTML file.
        deviceListScreen.hidden = false;
        mainControl.hidden = true;
        colorControl.hidden = true;
        timerControl.hidden=true;
        timerView.hidden=true;
        // Disable the refresh button until the app is completely ready
        refreshButton.disabled = true;

        // Register to be notified when the "device is ready"
        // This delays the execution of any more code until all the Cordova code is loaded.
        // (This file may be loaded before the Cordova.js file is loaded and, consequently,
        //  shouldn't use any of Cordova's features)
        // See: http://cordova.apache.org/docs/en/6.x/cordova/events/events.html#page-toc-source
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },

// **** Callbacks for application "lifecycle" events. These respond to significant events when the App runs ******

    // the device is ready and the app can "start"
    onDeviceReady: function() {
        // Cordova is now ready --- do remaining Cordova setup.
        console.log("onDeviceReady");

        red = 0;
        green = 0;
        blue = 0;

        document.getElementById("red_value_main").innerHTML=red;
        document.getElementById("green_value_main").innerHTML=green;
        document.getElementById("blue_value_main").innerHTML=blue;

        redSlider.defaultValue = red;
        greenSlider.defaultValue = green;
        blueSlider.defaultValue = blue;

        document.getElementById("red_value").innerHTML=red;
        document.getElementById("green_value").innerHTML=green;
        document.getElementById("blue_value").innerHTML=blue;

        // Button/Touch actions weren't setup in initialize()
        // because they will trigger Cordova specific actions
        refreshButton.ontouchstart = app.uiOnScan;
        refreshButton.disabled = false;
        deviceList.ontouchstart = app.uiOnConnect;
        onButton.ontouchstart = app.uiOnLampOn;
	    offButton.ontouchstart = app.uiOnLampOff;
        disconnectButton.ontouchstart = app.uiOnDisconnect;
        colorButton.ontouchstart = app.uiColorPage;
        timerButton.ontouchstart = app.uiTimerPage;
        setTimerButton.ontouchstart = app.uiViewTimerPage;


        // Color Page
        redSlider.ontouchmove = app.uiDisplayRedValue;
        greenSlider.ontouchmove = app.uiDisplayGreenValue;
        blueSlider.ontouchmove = app.uiDisplayBlueValue;
        redSlider.ontouchend = app.uiDisplayRedValue;
        greenSlider.ontouchend = app.uiDisplayGreenValue;
        blueSlider.ontouchend = app.uiDisplayBlueValue;

        fadeToColor.ontouchstart = app.uiFadeColor;

        colorToMain.ontouchstart = app.uiShowControlScreen;

        // Timer Page
        timerToMain.ontouchstart = app.uiShowControlScreen;

        // View Timers Page
        //startOnTimer.ontouchstart = ;
        //startOffTimer.ontouchstart = ;
        timerViewToMain.ontouchstart = app.uiShowControlScreen;




        // Call the uiOnScan function to automatically start scanning
        app.uiOnScan();
    },



// **** Callbacks from the user interface.  These respond to UI events ****
    // TODO: Add Functions to handle the callbacks (events) on the new controls
    // (Pay close attention to the syntax of functions)
    uiColorPage: function() {
        mainControl.hidden = true;
        colorControl.hidden = false;
        deviceListScreen.hidden = true;
        timerControl.hidden=true;
        timerView.hidden=true;

    },
    uiTimerPage: function() {
        mainControl.hidden = true;
        colorControl.hidden = true;
        deviceListScreen.hidden = true;
        timerControl.hidden=false;
        timerView.hidden=true;
    },

    uiViewTimerPage: function() {
        mainControl.hidden = true;
        colorControl.hidden = true;
        deviceListScreen.hidden = true;
        timerControl.hidden=true;
        timerView.hidden=false;
    },

    uiDisplayRedValue: function() {
        document.getElementById("red_value").innerHTML=document.getElementById("redSlider").value;
    },
    uiDisplayGreenValue: function() {
        document.getElementById("green_value").innerHTML=document.getElementById("greenSlider").value;
    },
    uiDisplayBlueValue: function() {
        document.getElementById("blue_value").innerHTML=document.getElementById("blueSlider").value;
    },

    uiFadeColor: function() {

        var data = new Uint8Array(4);
        data[0] = 2;
        data[1] = document.getElementById("redSlider").value;
        data[2] = document.getElementById("greenSlider").value;
        data[3] = document.getElementById("blueSlider").value;
        app.writeData(data);

        document.getElementById("red_value_main").innerHTML=document.getElementById("redSlider").value;
        document.getElementById("green_value_main").innerHTML=document.getElementById("greenSlider").value;
        document.getElementById("blue_value_main").innerHTML=document.getElementById("blueSlider").value;

    },

    // Start scanning (also called at startup)
    uiOnScan: function() {
        console.log("uiOnScan");

        deviceList.innerHTML = ""; // clear the list at the start of a uiOnScan
        app.uiShowProgressIndicator("Scanning for Bluetooth Devices...");

        // Start the uiOnScan and setup the "callbacks"
        ble.startScan([],
            app.bleOnDeviceDiscovered,
            function() { alert("Listing Bluetooth Devices Failed"); }
        );

        // Stop uiOnScan after 5 seconds
        setTimeout(ble.stopScan, 5000, app.bleOnScanComplete);
    },

    // An item has been selected, TRY to connect
    uiOnConnect: function (e) {
        console.log("uiOnConnect");
        // Stop scanning
        ble.stopScan();

        // Retrieve the device ID from the HTML element.
        var device = e.target.dataset.deviceId;
        // Request the connection
        ble.connect(device, app.bleOnConnect, app.bleOnDisconnect);

        // Show the status
        app.uiShowProgressIndicator("Requesting connection to " + device);


    },

    // The user has hit the Disconnect button
    uiOnDisconnect: function (e) {
        console.log("uiOnDisconnect");
        if (e) {
            e.preventDefault();
        }

        app.uiSetStatus("Disconnecting...");
        ble.disconnect(app.connectedPeripheral.id, function() {
            app.uiSetStatus("Disconnected");
            setTimeout(app.uiOnScan, 800);
        });
    },

    uiOnLampOn: function() {
        console.log("uiOnLampOn");

        var data = new Uint8Array(4);
        data[0] = 2;
        data[1] = document.getElementById("redSlider").value;
        data[2] = document.getElementById("greenSlider").value;
        data[3] = document.getElementById("blueSlider").value;

        document.getElementById("red_value_main").innerHTML=data[1];
        document.getElementById("green_value_main").innerHTML=data[2];
        document.getElementById("blue_value_main").innerHTML=data[3];

        redSlider.defaultValue = data[1];
        greenSlider.defaultValue = data[2];
        blueSlider.defaultValue = data[3];

        document.getElementById("red_value").innerHTML=data[1];
        document.getElementById("green_value").innerHTML=data[2];
        document.getElementById("blue_value").innerHTML=data[3];

        app.writeData(data);

        //var result = app.readData();
    },

    uiOnLampOff: function() {
        console.log("uiOnLampOff");
        var data = new Uint8Array(2);
        data[0] = 0x0;
        data[1] = 0x0;
        app.writeData(data);
    },



// **** Callbacks from the "ble" Object: These respond to BLE events
    bleOnDeviceDiscovered: function(device) {
        console.log("bleOnDeviceDiscovered");

        // Show the list of devices (if it isn't already shown)
        app.uiShowDeviceListScreen();

        console.log(JSON.stringify(device));

        // Add an item to the list

        // 1. Build the HTML element
        var listItem = document.createElement('li');  // Start list item (li)
        // Add a custom piece of data to the HTML item (so if the HTML item is selected it will
        // be possible to retrieve the device ID).
        listItem.dataset.deviceId = device.id;
        var rssi = "";
        if (device.rssi) {
            rssi = "RSSI: " + device.rssi + "<br/>";
        }
        listItem.innerHTML = device.name + "<br/>" + rssi + device.id;
        // 2. Add it to the list
        deviceList.appendChild(listItem);

        // Update the status
        var deviceListLength = deviceList.getElementsByTagName('li').length;
        app.uiSetStatus("Found " + deviceListLength +
                      " device" + (deviceListLength === 1 ? "." : "s."));
    },

    bleOnScanComplete: function() {
        console.log("bleOnScanComplete");
        var deviceListLength = deviceList.getElementsByTagName('li').length;
        if (deviceListLength === 0) {
            app.uiShowDeviceListScreen();
            app.uiSetStatus("No Bluetooth Peripherals Discovered.");
        }
    },

    // At the completion of a successful connection
    bleOnConnect: function(peripheral) {
        console.log("bleOnConnect");
        // Save the peripheral object for later use
        app.connectedPeripheral = peripheral;
        app.uiShowControlScreen();
        app.uiSetStatus("Connected");
    },

    bleOnDisconnect: function(reason) {
        console.log("bleOnDisconnect");
        if (!reason) {
            reason = "Connection Lost";
        }
        app.uiOnLampOff;
        app.uiHideProgressIndicator();
        app.uiShowDeviceListScreen();
        app.uiSetStatus(reason);
    },

// ***** Functions that update the user interfaces
    uiShowProgressIndicator: function(message) {
        if (!message) { message = "Processing"; }
        progress.firstElementChild.innerHTML = message;
        progress.hidden = false;
        statusDiv.innerHTML = "";
    },

    uiHideProgressIndicator: function() {
        progress.hidden = true;
    },

    uiShowDeviceListScreen: function() {
        mainControl.hidden = true;
        colorControl.hidden = true;
        deviceListScreen.hidden = false;
        timerControl.hidden=true;
        timerView.hidden=true;
        app.uiHideProgressIndicator();
        statusDiv.innerHTML = "";
    },

    uiShowControlScreen: function() {
        mainControl.hidden = false;
        colorControl.hidden = true;
        deviceListScreen.hidden = true;
        timerControl.hidden=true;
        timerView.hidden=true;
        app.uiHideProgressIndicator();
        statusDiv.innerHTML = "";
    },

    uiSetStatus: function(message){
        console.log(message);
        statusDiv.innerHTML = message;
    },

// Utility function for writing data
    writeData: function(data) {
        console.log("Write");
        console.log(data);
        var success = function() {
            console.log("Write success");
        };

        var failure = function() {
            alert("Failed writing data");
        };
        ble.writeWithoutResponse(app.connectedPeripheral.id, SERVICE_UUID, WRITE_UUID, data.buffer, success, failure);
    },

    // readData: function(data) {
    //     console.log("Read");
    //
    //     if (data[0] == 5) {
    //         document.getElementById("on_amount").innerHTML=data[1];
    //     }
    //     else if (data[0] == 6) {
    //         document.getElementById("off_amount").innerHTML=data[1];
    //     }
    // }
};

// When this code is loaded the app.initialize() function is called
// to start setting up the application logic.
app.initialize();
