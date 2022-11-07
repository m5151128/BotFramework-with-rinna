// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const fetch = require('node-fetch');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await fetch('https://api.rinna.co.jp/models/ecce', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Ocp-Apim-Subscription-Key': process.env.RINNA_SUBSCRIPTIONKEY_ECCE
                },
                body: JSON.stringify({
                    'knowledgePath': 'ECCE_Sample.txt',
                    'query': context.activity.text,
                    'dialogHistory': [],
                    'l2ReturnNum': 3,
                    'l3ReturnNum': 1
                })
            })
                .then(response => response.text())
                .then(async (result) => {
                    console.log(result);
                    const data = JSON.parse(result);
                    const replyText = data.resultResponseText;
                    await context.sendActivity(MessageFactory.text(replyText, replyText));
                    // By calling next() you ensure that the next BotHandler is run.
                    await next();
                })
                .catch(error => console.log('error', error));
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
