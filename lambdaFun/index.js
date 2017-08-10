'use strict';

var http = require('http');

exports.handler = function (event, context) {
    try {
        var request = event.request;

        if (request.type === "LaunchRequest") {
            let options = {};
            options.speechText = "Welcome to Greetings skill. Whom do you wish me to greet?";
            options.repromptText = "I am sorry, please tell me whom do you wish to greet. For example, you could say Alexa, say Hello to John.";
            options.endSession = false;
            context.succeed(buildResponse(options));
        } else if (request.type === "IntentRequest") {
            let options = {};
            if (request.intent.name === "HelloIntent") {
                let name = request.intent.slots.FirstName.value;
                options.speechText = "Hello " + name + ". ";
                options.speechText += getWish();
                getQuote(function (quote, err) {
                    if (err) {
                        context.fail(err);
                    } else {
                        options.speechText += quote;
                        options.endSession = true;
                        context.succeed(buildResponse(options));
                    }
                });

            } else {
                throw "Unknown intent";
            }

        } else if (request.type === "SessionEndedRequest") {

        } else {
            throw "Unknown Intent Type";
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function getQuote(callback) {
    var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
    var req = http.get(url, function (res) {
        var body = "";

        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            body = body.replace(/\\/g,'');
            var quote = JSON.parse(body);
            callback(quote.quoteText);
        })
    });
    req.on('error', function (err) {
        callback('', err)
    });
}

function getWish() {
    var thisDate = new Date();
    var hours = thisDate.getUTCHours() + 10;
    if (hours > 24) {
        hours -= 24;
    }
    if (hours < 12) {
        return "Good Morning. ";
    } else if (hours < 17) {
        return "Good Afternoon. ";
    } else {
        return "Good Evening. ";
    }
}

function buildResponse(options) {
    var response = {
        version: "1.0",
        response: {
            outputSpeech:   {
                type: "PlainText",
                text: options.speechText
            },
            shouldEndSession: options.endSession
        }
    };
    if (options.repromptText) {
        response.response.reprompt = {
            outputSpeech: {
                type: "PlainText",
                text: options.repromptText
            }
        };
    }
    return response;
}