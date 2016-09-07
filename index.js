'use strict';

require('dotenv').load();
const http = require('http');
const RC = require('ringcentral');
const BOX = require('box-node-sdk');
const jwt = require('jsonwebtoken');

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
var jwtExp = jwtExp + process.env.BOX_JWT_CLAIMS_EXP;

// jwt module expects payload to contain header and claims (seems to work...but Box docs do not line up)
var boxJwtClaims = {
    alg: process.env.BOX_JWT_HEADER_ALG,
    typ: process.env.BOX_JWT_HEADER_TYP,
    kid: process.env.BOX_KEY_ID,
    iss: process.env.BOX_CLIENT_ID,
    sub: process.env.BOX_JWT_CLAIMS_SUB,
    box_sub_type: process.env.BOX_JWT_CLAIMS_BOX_SUB_TYPE,
    aud: process.env.BOX_JWT_CLAIMS_AUD,
    jti: process.env.BOX_JWT_CLAIMS_JTI,
    exp: jwtExp 
};

var myJWT = jwt.sign(boxJwtClaims,process.env.BOX_PRIVATE_KEY);
console.log('myJWT: ', myJWT);

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

// TODO - Needs Promise-wrapped to wait for Auth response and invalidation
boxsdk.getTokensAuthorizationCodeGrant(authCode, null, function(err, tokenInfo) {
    console.log('Box tokenInfo: ', tokenInfo);
});
console.log('Box auth: ', boxsdk);

// Authenticate with RingCentral
var platform = rcsdk.platform();
platform.login({
    username: process.env.RC_ADMIN_USERNAME,
    password: process.env.RC_ADMIN_PASSWORD,
    extension: process.env.RC_ADMIN_EXTENSION
})
.then(function(authRes) {
    console.log('RignCentral Login Response: ', authRes.json());
})
.catch(function(e) {
    console.error(e);
    throw e;
});

// Configure RingCentral Subscription
var subscription = rcsdk.createSubscription();

// TODO - This is broken right now
// Get the enterprise client, used to create and manage app user accounts
boxsdk.getPersistentClient();


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

// Register Subscription Event Listeners
subscription.on(subscription.events.notification, function(e) {
    console.log('Subscription notification', e);
});
subscription.on(subscription.events.removeSuccess, function(e) {
    console.log('Subscription removeSuccess', e);
});
subscription.on(subscription.events.removeError, function(e) {
    console.log('Subscription removeError', e);
});
subscription.on(subscription.events.renewSuccess, function(e) {
    console.log('Subscription renewSuccess', e);
});
subscription.on(subscription.events.renewError, function(e) {
    console.log('Subscription renewError', e);
});
subscription.on(subscription.events.subscribeSuccess, function(e) {
    console.log('Subscribe Success', e);
});
subscription.on(subscription.events.subscribeError, function(e) {
    console.log('Subscribe Error', e);
});

// Box SDK Event Handlers
boxsdk.on('response', function(err, data) {
    if(err) {
        console.error(err);
        throw err;
    } else {
        console.log('Box Response Data: ', data);
        // TODO: Is auth response?
        // TODO: Is content response?
    }
});

// HTTP Server
server.listen(process.env.PORT, function() {
    console.log('server is listening...');
});
