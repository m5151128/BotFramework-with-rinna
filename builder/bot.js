// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const fetch = require('node-fetch');

// The accessor names for the conversation data state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const RINNA_SUBSCRIPTIONKEY_ECCE = process.env.RINNA_SUBSCRIPTIONKEY_ECCE;

class StateManagementBot extends ActivityHandler {
    constructor(conversationState) {
        super();
        // Create the state property accessors for the conversation data.
        this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);

        // The state management objects for the conversation state.
        this.conversationState = conversationState;

        this.onMessage(async (turnContext, next) => {
            // Get the state properties from the turn context.
            const conversationData = await this.conversationDataAccessor.get(
                turnContext, { dialogHistory: [] });
            conversationData.dialogHistory.push(turnContext.activity.text);
            console.log(conversationData.dialogHistory);

            const replyText = await this.getReplyTextWithEcce(
                turnContext.activity.text, conversationData.dialogHistory);
            conversationData.dialogHistory.push(replyText);
            await turnContext.sendActivity(replyText);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to State Bot Sample. Type anything to get started.');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
    }

    async getReplyTextWithEcce(text, dialogHistory) {
        let replyText = '';

        await fetch('https://api.rinna.co.jp/models/ecce', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': RINNA_SUBSCRIPTIONKEY_ECCE
            },
            body: JSON.stringify({
                'knowledgePath': 'ECCE_Sample.txt',
                'query': text,
                'dialogHistory': dialogHistory,
                'l2ReturnNum': 3,
                'l3ReturnNum': 1
            })
        })
            .then(response => response.text())
            .then(async (result) => {
                console.log(result);
                const data = JSON.parse(result);
                replyText = data.resultResponseText;
            })
            .catch(error => console.log('error', error));

        return replyText;
    }
}

module.exports.StateManagementBot = StateManagementBot;
