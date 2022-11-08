// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');
const fetch = require('node-fetch');
const ApoListCard = require('./resources/ApiListCard.json');

// The accessor names for the conversation data state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const COMMON_MESSAGE_ABOUT_HELP = '他のAPIを試したくなったら「ヘルプ」と送ってね';
const RINNA_SUBSCRIPTIONKEY_ECCE = process.env.RINNA_SUBSCRIPTIONKEY_ECCE;
const RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION = process.env.RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION;
const RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION = process.env.RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION;
const RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION = process.env.RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION;

class RinnaBot extends ActivityHandler {
    constructor(conversationState) {
        super();
        // Create the state property accessors for the conversation data.
        this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);

        // The state management objects for the conversation state.
        this.conversationState = conversationState;

        this.onMessage(async (context, next) => {
            // Get the state properties from the turn context.
            const conversationData = await this.conversationDataAccessor.get(
                context,
                {
                    mode: 'ecce',
                    dialogHistory: []
                }
            );

            const text = context.activity.text;
            console.log(text);

            switch (text) {
            case 'ヘルプ':
            case 'help':
                await this.showApiListCard(context);
                conversationData.mode = 'help';
                conversationData.dialogHistory = [];
                break;
            case 'ECCE':
                await context.sendActivity(`雑談を始めましょう。${ COMMON_MESSAGE_ABOUT_HELP }`);
                conversationData.mode = 'ecce';
                conversationData.dialogHistory = [];
                break;
            case 'Emotion Classification API':
                await context.sendActivity(`テキストを怒り,恥ずかしい,嬉しい,悲しい,驚き,恐れ,意味不明,その他の感情に分類します。${ COMMON_MESSAGE_ABOUT_HELP }`);
                conversationData.mode = 'ec';
                conversationData.dialogHistory = [];
                break;
            case 'Positive Negative Classification API':
                await context.sendActivity(`テキストをPositive、Negative、Flatに分類します。${ COMMON_MESSAGE_ABOUT_HELP }`);
                conversationData.mode = 'pnc';
                conversationData.dialogHistory = [];
                break;
            case 'Profanity Classification API':
                await context.sendActivity(`テキストに差別や残虐行為、政治・宗教等にかかわる不適切な表現を検出します。${ COMMON_MESSAGE_ABOUT_HELP }`);
                conversationData.mode = 'pc';
                conversationData.dialogHistory = [];
                break;
            default: {
                let replyText = '';
                const mode = conversationData.mode;
                switch (mode) {
                case 'ecce': {
                    replyText = await this.getReplyTextWithEcce(text, conversationData.dialogHistory);
                    conversationData.dialogHistory.push(text);
                    conversationData.dialogHistory.push(replyText);
                    break;
                }
                case 'ec': {
                    replyText = await this.getReplyTextWithEmotionClassification(text);
                    conversationData.dialogHistory.push(replyText);
                    break;
                }
                case 'pnc': {
                    replyText = await this.getReplyTextWithPositiveNegativeClassification(text);
                    conversationData.dialogHistory.push(replyText);
                    break;
                }
                case 'pc': {
                    replyText = await this.getReplyTextWithProfanityClassification(text);
                    conversationData.dialogHistory.push(replyText);
                    break;
                }
                }
                await context.sendActivity(replyText);
            }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await this.showApiListCard(context);
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

    async showApiListCard(context) {
        await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(ApoListCard)]
        });
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

    async getReplyTextWithEmotionClassification(text) {
        let replyText = '';

        await fetch('https://api.rinna.co.jp/models/emotion-classification', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION
            },
            body: JSON.stringify({
                'data': [text],
            })
        })
            .then(response => response.text())
            .then(async (result) => {
                console.log(result);
                const data = JSON.parse(result);
                const emotion = data.data[0].output.prediction_labels[0];
                replyText = `この感情は「${ emotion }」だと思います`;
            })
            .catch(error => console.log('error', error));

        return replyText;
    }

    async getReplyTextWithPositiveNegativeClassification(text) {
        let replyText = '';

        await fetch('https://api.rinna.co.jp/modules/positivenegative-classification', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION
            },
            body: JSON.stringify({
                'texts': [text],
            })
        })
            .then(response => response.text())
            .then(async (result) => {
                console.log(result);
                const data = JSON.parse(result);
                const mind = data.output.prediction_labels[0];
                replyText = `この心理状態は「${ mind }」だと思います`;
            })
            .catch(error => console.log('error', error));

        return replyText;
    }

    async getReplyTextWithProfanityClassification(text) {
        let replyText = '';

        await fetch('https://api.rinna.co.jp/models/profanity-classification', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION
            },
            body: JSON.stringify({
                'text': text,
            })
        })
            .then(response => response.text())
            .then(async (result) => {
                console.log(result);
                const data = JSON.parse(result);
                replyText = data.prediction ? '不適切な表現が含まれていると思います' : '不適切な表現は含まれていないと思います';
            })
            .catch(error => console.log('error', error));

        return replyText;
    }
}

module.exports.RinnaBot = RinnaBot;
