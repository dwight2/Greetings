'use strict';

var http = require('http');

exports.handler = function (event, context) {
    try {
        var request = event.request;
        var session = event.session;

        if (!session.attributes) {
            session.attributes = {};
        }

        if (request.type === "LaunchRequest") {
            handleLaunchRequest(context);
        } else if (request.type === "IntentRequest") {
            if (request.intent.name === "HelloIntent") {
                handleHelloIntent(request, context);

            } else if (request.intent.name === "QuoteIntent") {
                handleQuoteIntent(request, context, session);

            } else if (request.intent.name === "NextQuoteIntent") {
                handleNextQuoteIntent(request, context, session);
            } else if (request.intent.name === "StopIntent" || request.intent.name === "CancelIntent") {
                context.succeed(buildResponse({
                    speechText: "Good Bye. ",
                    endSession: true
                }));
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
    if (options.cardTitle) {
        response.response.card = {
            type: "Simple",
            title: options.cardTitle
        }
    }
    if (options.imageUrl) {
        response.response.card.type = "Standard";
        response.response.card.text = options.cardContent;
        response.response.card.image = {
            smallImageUrl: options.imageUrl,
            largeImageUrl: options.imageUrl
        };
    } else {
        response.response.card.content = options.cardContent;
    }

    if (options.session && options.session.attributes) {
        response.sessionAttributes = options.session.attributes;
    }
    return response;
}

function handleLaunchRequest(context) {
    let options = {};
    options.speechText = "Welcome to Greetings skill. Whom do you wish me to greet?";
    options.repromptText = "I am sorry, please tell me whom do you wish to greet. For example, you could say Alexa, say Hello to John.";
    options.endSession = false;
    context.succeed(buildResponse(options));
}

function handleHelloIntent(request, context) {
    let options = {};
    let name = request.intent.slots.FirstName.value;
    options.speechText = `Hello <say-as interpret-as="spell-out">${name}</say-as> ${name}. `;
    options.speechText += getWish();
    options.cardTitle = `Hello ${name}`;
    getQuote(function (quote, err) {
        if (err) {
            context.fail(err);
        } else {
            options.speechText += quote;
            options.cardContent = quote;
            options.imageUrl = "    ";
            options.endSession = true;
            context.succeed(buildResponse(options));
        }
    });
}

function handleQuoteIntent(request, context, session) {
    let options = {};
    options.session = session;
    getQuote(function (quote, err) {
        if (err) {
            context.fail(err);
        } else {
            options.speechText += quote;
            options.speechText += " Do you want to hear another quote? ";
            options.repromptText += "You can say yes, more or another one. ";
            options.session.attributes.quoteIntent = true;
            options.endSession = false;
            context.succeed(buildResponse(options));
        }
    });
}

function handleNextQuoteIntent(request, context, session) {
    let options = {};
    options.session = session;
    if (session.attributes.quoteIntent) {
        getQuote(function (quote, err) {
            if (err) {
                context.fail(err);
            } else {
                options.speechText += quote;
                options.speechText += " Do you want to hear another quote? ";
                options.repromptText += "You can say yes, more or another one. ";
                options.session.attributes.quoteIntent = true;
                options.endSession = false;
                context.succeed(buildResponse(options));
            }
        });
    } else {
        options.speechText = " Wrong invocation of this intent. ";
        options.endSession = true;
        context.succeed(buildResponse(options));
    }
}