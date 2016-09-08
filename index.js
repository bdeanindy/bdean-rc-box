'use strict';

require('dotenv').load();
const fs = require('fs');
const http = require('http');
const moment = require('moment');
const rp = require('request-promise');
const RC = require('ringcentral');
const BOX = require('box-node-sdk');
const jwt = require('jsonwebtoken');

// App Vars
var boxClient, recordingLogRecords;

// Configure the server
var server = http.createServer();
server.on('request', function(req, res) {
});

// Instantiate RingCentral SDK
var rcsdk = new RC({
    server: process.env.RC_SERVER,
    appKey: process.env.RC_APP_KEY,
    appSecret: process.env.RC_APP_SECRET
});

// Duplicating in the payload since that seems like where this is data needs to be
var boxJwtHeader = {
    alg: process.env.BOX_JWT_HEADER_ALG,
    typ: process.env.BOX_JWT_HEADER_TYP,
    kid: process.env.BOX_KEY_ID
};

// Generate Unix timestamp and add JWT Claims EXP time of 60 seconds max per Box docs
var jwtExp = Math.floor(Date.now() / 1000); // In seconds
var jwtExp = Number(jwtExp) + Number(process.env.BOX_JWT_CLAIMS_EXP);

// jwt module expects payload to contain header and claims (seems to work...but Box docs do not line up)
var boxJwt = {
        header: {
            alg: process.env.BOX_JWT_HEADER_ALG,
            typ: process.env.BOX_JWT_HEADER_TYP,
            kid: process.env.BOX_KEY_ID
        },
        claims: {
            iss: process.env.BOX_CLIENT_ID,
            sub: process.env.BOX_JWT_CLAIMS_SUB,
            box_sub_type: process.env.BOX_JWT_CLAIMS_BOX_SUB_TYPE,
            aud: process.env.BOX_JWT_CLAIMS_AUD,
            jti: process.env.BOX_JWT_CLAIMS_JTI,
            exp: jwtExp 
        }
};

var myJWT = jwt.sign(boxJwt, process.env.BOX_PRIVATE_KEY);

// Instantiate and authenticate with Box
var boxsdk = new BOX({
    clientID: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
    appAuth: {
        keyID: process.env.BOX_KEY_ID,
        privateKey: process.env.BOX_PRIVATE_KEY,
        passphrase: process.env.BOX_PRIVATE_KEY_PASSPHRASE
    }
});

// Authenticate with RingCentral
var platform = rcsdk.platform();
platform.login({
    username: process.env.RC_ADMIN_USERNAME,
    password: process.env.RC_ADMIN_PASSWORD,
    extension: process.env.RC_ADMIN_EXTENSION
})
.then(function(authRes) {
    console.log('RignCentral Login Response: ', authRes.json());
    var boxAuthUrl = boxsdk.getAuthorizeURL({client_id: process.env.BOX_CLIENT_ID});
    console.log('Box Auth URL: ', boxAuthUrl);
    boxClient = boxsdk.getAppAuthClient('enterprise', process.env.BOX_ENTERPRISE_ID);
    // We should be ready to start making API requests...
    getCallsWithRecordings();
})
.catch(function(e) {
    console.error(e);
    throw e;
});

function getCallsWithRecordings() {
    // Not used currently, but can replace `dateFrom` and `dateTo` below, since I haven't created a call recording in the past 24 hours
    var today = moment();
    var todayMinus24 = today.subtract({hours: 24});

    // Gets call logs which have recordings
    platform.get(
        '/account/~/extension/~/call-log',
        {
            withRecording: true,
            dateFrom: '2016-01-01T00:00:00.000Z',
            dateTo: '2016-09-09T00:00:00.000Z'
        })
        .then(function(callLogsWithRecordings) {
            var callLogsFilename = 'callLogRecords_' + jwtExp + '.json';
            var callLogData = callLogsWithRecordings.json().records;
            fs.writeFile(callLogsFilename, JSON.stringify(callLogData), 'utf8', function(err){
                if(err) {
                    console.error(err);
                    throw err;
                } else {
                    storeOnBox(callLogsFilename);
                }
            });
        })
        .catch(function(e) {
            console.error(e);
            throw e;
        });
}

function storeOnBox(filename) {
    var stream = fs.createReadStream(filename);
    boxClient.files.uploadFile('0', filename, stream, function(err, data) {
        if(err) {
            console.error(err);
            throw err;
        } else {
            console.log('DATA SAVED ON BOX: ', data);
        }
    });
}

// Register Platform Event Listeners
platform.on(platform.events.loginSuccess, function(e){
    console.log('RingCentral SDK loginSuccess');
});

platform.on(platform.events.loginError, function(e){
    console.log('loginError', e);
});

platform.on(platform.events.logoutSuccess, function(e){
    console.log('logoutSuccess', e);
});

platform.on(platform.events.logoutError, function(e){
    console.log('logoutError', e);
});

platform.on(platform.events.refreshSuccess, function(e){
    console.log('refreshSuccess', e);
});

platform.on(platform.events.refreshError, function(e){
    console.log('refreshError', e);
});


// Box SDK Event Handlers
boxsdk.on('response', function(err, data) {
    if(err) {
        console.error(err);
        throw err;
    } else {
        //console.log('BOX RESPONSE DATA: ', data);
        //console.log('BOX REQUEST URL: ', data.request.uri);
        //console.log('BOX RESPONSE DATA: ', data.body);
        if('/oauth2/token' === data.request.uri.pathname) {
            console.log('Box Auth Data: ', data.body);
        }

        if('/2.0/users/me' === data.request.uri.pathname) {
            console.log('Box User data: ', data.body);
        }
    }
});


// HTTP Server
server.listen(process.env.PORT, function() {
    console.log('server is listening...');
});
