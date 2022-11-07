# BotFramework-with-rinna

## rinna

rinna developers: https://developers.rinna.co.jp/ にアクセスし会員登録する。  
サインインしたら https://developers.rinna.co.jp/product#product=ecce-api にアクセスし、「Subscribe」からキーを発行する。  
発行されたキーを`.env`の`RINNA_SUBSCRIPTIONKEY_ECCE`に設定する。

## Emulatorのダウンロード

https://github.com/microsoft/BotFramework-Emulator/releases からダウンロード

## Builderの起動

```
$ cd builder
$ npm install
$ npm start
```

## ngrokの起動

```
$ ngrok http 3978 --host-header rewrite
```

## Emulatorの起動

Open BptからBot URLを `http://localhost:3978/api/messages` として起動する
