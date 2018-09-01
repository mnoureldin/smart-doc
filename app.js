/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var AssistantV1 = require('watson-developer-cloud/assistant/v1'); // watson sdk
var moment = require('moment');

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var assistant = new AssistantV1({
  version: '2018-07-10'
});

// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {
  var workspace;
  if(req.body.workspace.id === 1) {
    workspace = process.env.WORKSPACE_ID1 || '<workspace-id>';
  } else if(req.body.workspace.id === 2) {
    workspace = process.env.WORKSPACE_ID2 || '<workspace-id>';
  }

  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Initialize citizens chatbot context variables
  if(req.body.workspace.id === 1 && !req.body.context) {
    payload.context = {
      "disease": "Cholera",
      "guidance": entities["Guidance"],
      "symptoms": entities["Symptom"],
      "precautionsDo": entities["Precaution_Do"],
      "infectionReason": entities["Infection_Reason"],
      "incubationPeriod": entities["Incubation_Period"],
      "precautionsDoNot": entities["Precaution_DoNot"]
    };
  }

  // Send the input to the assistant service
  assistant.message(payload, function (err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }

    // This is a fix for now, as since Assistant version 2018-07-10,
    // output text can now be in output.generic.text
    var output = data.output;
    if (output.text.length === 0 && output.hasOwnProperty('generic')) {
      var generic = output.generic;

      if (Array.isArray(generic)) {
        // Loop through generic and add all text to data.output.text.
        // If there are multiple responses, this will add all of them
        // to the response.
        for(var i = 0; i < generic.length; i++) {
          if (generic[i].hasOwnProperty('text')) {
            data.output.text.push(generic[i].text);
          } else if (generic[i].hasOwnProperty('title')) {
            data.output.text.push(generic[i].title);
          }
        }
      }
    }

    // Call Watson machine learning if all required context variables exist
    var requiredVars = ['Governorate', 'Cases', 'deaths'];
    if(requiredVars.every(function (v) { return v in data['context'];})) {
      console.log("all required context variables exist");
      classify(data['context']['Governorate'],
        parseInt(data['context']['Cases'], 10),
        parseInt(data['context']['deaths'], 10));
    }
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;

////////////////////////////////////////////////////////////////////////////////
// Credentials retrieved from IBM Cloud Watson Machine Learning Service instance

var wml_service_credentials_url = process.env.WML_URL;
var wml_service_credentials_username = process.env.WML_USERNAME;
var wml_service_credentials_password = process.env.WML_PASSWORD;

////////////////////////////////////////////////////////////////////////////////
// Watson Studio Model

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const btoa = require("btoa");
const wml_credentials = new Map();

wml_credentials.set("url", wml_service_credentials_url);
wml_credentials.set("username", wml_service_credentials_username);
wml_credentials.set("password", wml_service_credentials_password);

function apiGet(url, username, password, loadCallback, errorCallback){
	const oReq = new XMLHttpRequest();
	const tokenHeader = "Basic " + btoa((username + ":" + password));
	const tokenUrl = url + "/v3/identity/token";

	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("GET", tokenUrl);
	oReq.setRequestHeader("Authorization", tokenHeader);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send();
}

function apiPost(scoring_url, token, payload, loadCallback, errorCallback){
	const oReq = new XMLHttpRequest();
	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("POST", scoring_url);
	oReq.setRequestHeader("Accept", "application/json");
	oReq.setRequestHeader("Authorization", token);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send(payload);
}

const csvFilePath='Data_with_population.csv';
const csv=require('csvtojson');
var population = {};
csv().fromFile(csvFilePath).then(function (jsonObj) {
  jsonObj.forEach(function (e) {
    population[e['Governorate']] = e['Population'];
  });
});

function classify(governorate, cases, deaths) {
  var cfr = deaths/cases*100;
  var attack_rate = cases/population[governorate]*1000;
  var payload = JSON.stringify({
    "fields": ["Date", "Governorate", "Cases", "Deaths", "CFR", "Attack_Rate", "Attack_Rate_W1", "Attack_Rate_W2", "Attack_Rate_W3"],
    "values": [[moment().format('MM/DD/YYYY'), governorate, cases, deaths, cfr, attack_rate, attack_rate*0.9, attack_rate*0.7, attack_rate*0.5]]
  });

  apiGet(wml_credentials.get("url"),
	  wml_credentials.get("username"),
	  wml_credentials.get("password"),
	  function (res) {
          let parsedGetResponse;
          try {
              parsedGetResponse = JSON.parse(this.responseText);
          } catch(ex) {
              // TODO: handle parsing exception
          }
          if (parsedGetResponse && parsedGetResponse.token) {
              const token = parsedGetResponse.token
              const wmlToken = "Bearer " + token;

              const scoring_url = "https://us-south.ml.cloud.ibm.com/v3/wml_instances/4fb127ba-26e4-4e59-a45d-e5d22599416a/deployments/01fa6cb6-0fca-44f6-a2ae-679fd155e9dc/online";

              console.log("payload:");
              console.log(payload);
              apiPost(scoring_url, wmlToken, payload, function (resp) {
                  let parsedPostResponse;
                  try {
                      parsedPostResponse = JSON.parse(this.responseText);
                      console.log("Scoring response");
                      console.log(parsedPostResponse);
                      console.log("*** prediction = " + parsedPostResponse['values'][0][13] + " ***");
                  } catch (ex) {
                      // TODO: handle parsing exception
                  }
             }, function (error) {
                  console.log(error);
              });
          } else {
              console.log("Failed to retrieve Bearer token");
          }
	  }, function (err) {
		  console.log(err);
	  });
}

////////////////////////////////////////////////////////////////////////////////
// Watson Discovery

var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

var discovery = new DiscoveryV1({
  username: process.env.DISCOVERY_USERNAME,
  password: process.env.DISCOVERY_PASSWORD,
  url: 'https://gateway.watsonplatform.net/discovery/api/',
  version: '2017-09-01'
});

var entities = {};

discovery.query(
  {
    environment_id: process.env.DISCOVERY_ENVIRONMENT,
    collection_id: process.env.DISCOVERY_COLLECTION,
    query: 'Cholera'
  },
  function(err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log("Watson Discovery Response");
      response['results'].forEach(function(result) {
        result['enriched_text']['entities'].forEach(function(entity) {
          if(entity['type'] in entities) {
            entities[entity['type']].push(entity['text']);
          } else {
            entities[entity['type']] = [entity['text']];
          }
        });
      });

      // Concatenate entities of the same type
      for(var type in entities) {
        var entitiesConcatenated = "";
        Array.from(new Set(entities[type])).forEach(function(text, index) {
          entitiesConcatenated = entitiesConcatenated + (index+1) + ") " + text + ". ";
        });
        entities[type] = entitiesConcatenated;
      }
      console.log(JSON.stringify(entities, null, 2));
    }
  }
);
