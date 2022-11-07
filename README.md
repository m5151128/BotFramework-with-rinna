# BotFramework-with-rinna

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
