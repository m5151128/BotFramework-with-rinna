// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, CardFactory, ConversationState } from "botbuilder";

import fetch from "node-fetch";

import ApiListCard from "./resources/ApiListCard.json";

// The accessor names for the conversation data state property accessors.
const CONVERSATION_DATA_PROPERTY = "conversationData";
const COMMON_MESSAGE_ABOUT_HELP =
  "他のAPIを試したくなったら「ヘルプ」と送ってね";
const RINNA_SUBSCRIPTIONKEY_ECCE = process.env.RINNA_SUBSCRIPTIONKEY_ECCE;
const RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION =
  process.env.RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION;
const RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION =
  process.env.RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION;
const RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION =
  process.env.RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION;
const RINNA_SUBSCRIPTIONKEY_TEXT_TO_IMAGE =
  process.env.RINNA_SUBSCRIPTIONKEY_TEXT_TO_IMAGE;
const RINNA_SUBSCRIPTIONKEY_TEXT_TO_SPEECG =
  process.env.RINNA_SUBSCRIPTIONKEY_TEXT_TO_SPEECG;

export class RinnaBot extends ActivityHandler {
  private conversationState: ConversationState;

  constructor(conversationState: ConversationState) {
    super();
    // Create the state property accessors for the conversation data.
    const conversationDataAccessor = conversationState.createProperty(
      CONVERSATION_DATA_PROPERTY
    );

    // The state management objects for the conversation state.
    this.conversationState = conversationState;

    this.onMessage(async (context, next) => {
      // Get the state properties from the turn context.
      const conversationData = await conversationDataAccessor.get(context, {
        mode: "ecce",
        dialogHistory: [],
      });

      const text = context.activity.text;
      console.log(text);

      switch (text) {
        case "ヘルプ":
        case "help":
          await this.showApiListCard(context);
          conversationData.mode = "help";
          conversationData.dialogHistory = [];
          break;
        case "ECCE":
          await context.sendActivity(
            `雑談を始めましょう。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "ecce";
          conversationData.dialogHistory = [];
          break;
        case "Emotion Classification API":
          await context.sendActivity(
            `テキストを怒り,恥ずかしい,嬉しい,悲しい,驚き,恐れ,意味不明,その他の感情に分類します。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "ec";
          conversationData.dialogHistory = [];
          break;
        case "Positive Negative Classification API":
          await context.sendActivity(
            `テキストをPositive、Negative、Flatに分類します。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "pnc";
          conversationData.dialogHistory = [];
          break;
        case "Profanity Classification API":
          await context.sendActivity(
            `テキストに差別や残虐行為、政治・宗教等にかかわる不適切な表現を検出します。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "pc";
          conversationData.dialogHistory = [];
          break;
        case "Text To Image API":
          await context.sendActivity(
            `テキストから画像を生成します。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "tti";
          conversationData.dialogHistory = [];
          break;
        case "Text To Speech API":
          await context.sendActivity(
            `テキストから自然な合成音声で発話します。${COMMON_MESSAGE_ABOUT_HELP}`
          );
          conversationData.mode = "tts";
          conversationData.dialogHistory = [];
          break;
        default: {
          let reply;
          const mode = conversationData.mode;
          switch (mode) {
            case "ecce": {
              reply = await this.getReplyWithEcce(
                text,
                conversationData.dialogHistory
              );
              conversationData.dialogHistory.push(text);
              conversationData.dialogHistory.push(reply);
              break;
            }
            case "ec": {
              reply = await this.getReplyWithEmotionClassification(text);
              await context.sendActivity(reply);
              break;
            }
            case "pnc": {
              reply = await this.getReplyWithPositiveNegativeClassification(
                text
              );
              await context.sendActivity(reply);
              break;
            }
            case "pc": {
              reply = await this.getReplyWithProfanityClassification(text);
              await context.sendActivity(reply);
              break;
            }
            case "tti": {
              await context.sendActivity("画像が生成されるまで待ってね");

              reply = {};
              reply.attachments = [await this.getReplyWithTextToImage(text)];
              await context.sendActivity(reply);
              break;
            }
            case "tts": {
              reply = {};
              reply.attachments = [await this.getReplyWithTextToSpeech(text)];
              await context.sendActivity(reply);
              break;
            }
          }
          //   await context.sendActivity(reply);
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
      attachments: [CardFactory.adaptiveCard(ApiListCard)],
    });
  }

  async getReplyWithEcce(text, dialogHistory) {
    let reply = "";

    await fetch("https://api.rinna.co.jp/models/ecce", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": RINNA_SUBSCRIPTIONKEY_ECCE,
      },
      body: JSON.stringify({
        knowledgePath: "ECCE_Sample.txt",
        query: text,
        dialogHistory: dialogHistory,
        l2ReturnNum: 3,
        l3ReturnNum: 1,
      }),
    })
      .then((response) => response.text())
      .then(async (result) => {
        console.log(result);
        const data = JSON.parse(result);
        reply = data.resultResponseText;
      })
      .catch((error) => console.log("error", error));

    return reply;
  }

  async getReplyWithEmotionClassification(text) {
    let reply = "";

    await fetch("https://api.rinna.co.jp/models/emotion-classification", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key":
          RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION,
      },
      body: JSON.stringify({
        data: [text],
      }),
    })
      .then((response) => response.text())
      .then(async (result) => {
        console.log(result);
        const data = JSON.parse(result);
        const emotion = data.data[0].output.prediction_labels[0];
        reply = `この感情は「${emotion}」だと思います`;
      })
      .catch((error) => console.log("error", error));

    return reply;
  }

  async getReplyWithPositiveNegativeClassification(text) {
    let reply = "";

    await fetch(
      "https://api.rinna.co.jp/modules/positivenegative-classification",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key":
            RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION,
        },
        body: JSON.stringify({
          texts: [text],
        }),
      }
    )
      .then((response) => response.text())
      .then(async (result) => {
        console.log(result);
        const data = JSON.parse(result);
        const mind = data.output.prediction_labels[0];
        reply = `この心理状態は「${mind}」だと思います`;
      })
      .catch((error) => console.log("error", error));

    return reply;
  }

  async getReplyWithProfanityClassification(text) {
    let reply = "";

    await fetch("https://api.rinna.co.jp/models/profanity-classification", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key":
          RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION,
      },
      body: JSON.stringify({
        text: text,
      }),
    })
      .then((response) => response.text())
      .then(async (result) => {
        console.log(result);
        const data = JSON.parse(result);
        reply = data.prediction
          ? "不適切な表現が含まれていると思います"
          : "不適切な表現は含まれていないと思います";
      })
      .catch((error) => console.log("error", error));

    return reply;
  }

  async getReplyWithTextToImage(text) {
    let reply = "";

    await fetch("https://api.rinna.co.jp/models/tti/v2", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": RINNA_SUBSCRIPTIONKEY_TEXT_TO_IMAGE,
      },
      body: JSON.stringify({
        prompts: text,
        scale: 7.5,
      }),
    })
      .then((response) => response.text())
      .then(async (result) => {
        // console.log(result);
        const data = JSON.parse(result);
        reply = data.image;
      })
      .catch((error) => console.log("error", error));

    return CardFactory.heroCard(text, CardFactory.images([reply]));
  }

  async getReplyWithTextToSpeech(text) {
    let reply = "";

    await fetch("https://api.rinna.co.jp/models/cttse/v2", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": RINNA_SUBSCRIPTIONKEY_TEXT_TO_SPEECG,
      },
      body: JSON.stringify({
        sid: 27,
        tid: 1,
        speed: 1,
        text: text,
        volume: 10,
        format: "wav",
      }),
    })
      .then((response) => response.text())
      .then(async (result) => {
        console.log(result);
        const data = JSON.parse(result);
        console.log(data.mediaContentUrl);
        reply = data.mediaContentUrl;
      })
      .catch((error) => console.log("error", error));

    return CardFactory.audioCard(text, [reply]);
  }
}

module.exports.RinnaBot = RinnaBot;
