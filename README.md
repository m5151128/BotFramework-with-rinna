# BotFramework-with-rinna

## rinna

rinna developers: https://developers.rinna.co.jp/ にアクセスし会員登録する。  
サインインしたら各APIにて「Subscribe」からキーを発行する。  
発行されたキーを`.env`に設定する。

| API                                 | .env                                                   |
|-------------------------------------|--------------------------------------------------------|
| ECCE                                | RINNA_SUBSCRIPTIONKEY_ECCE                             |
| Emotion Classification API          | RINNA_SUBSCRIPTIONKEY_EMOTION_CLASSIFICATION           |
| Positive Negative Classification API​ | RINNA_SUBSCRIPTIONKEY_POSITIVE_NEGATIVE_CLASSIFICATION |
| Profanity Classification API        | RINNA_SUBSCRIPTIONKEY_PROFANITY_CLASSIFICATION         |
| Text to Image API                   | RINNA_SUBSCRIPTIONKEY_TEXT_TO_IMAGE                    |
| Text To Speech API                  | RINNA_SUBSCRIPTIONKEY_TEXT_TO_SPEECG                   |

## Emulatorのダウンロード

https://github.com/microsoft/BotFramework-Emulator/releases からダウンロード

## Builderの起動

```
$ cd builder
$ npm install
$ npm start
```

## Emulatorの起動

Open BptからBot URLを `http://localhost:3978/api/messages` として起動する
