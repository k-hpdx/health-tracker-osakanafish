# 健康記録アプリ

毎日の食事・体調・生活習慣を1タップで記録し、カレンダーで振り返るためのスマホ向け Web アプリ。

## 特徴

- **インストール不要**：ブラウザで開くだけ。スマホでは「ホーム画面に追加」でアプリ化できます
- **オフライン対応**：一度開けばネットなしで動作します
- **無料**：サーバー不要。GitHubアカウントがあればPC↔スマホ同期も無料
- **同期は任意**：ローカル保存のままでもOK、Firebase（Googleログイン）でクラウド同期も可

## 記録できる項目

- 🍵 **お茶（ノンカフェイン）**：ハブ茶・白湯・番茶・麦茶・トウモロコシ茶・雑穀茶・グリーンルイボス・黒豆茶・はとむぎ茶・ハーブティー
- ☕ **カフェイン**：紅茶・コーヒー・緑茶・ほうじ茶
- 📋 **有無**：白砂糖 / 小麦 / 生理 / ヨガ
- 😊 **体調**：5段階評価
- 🩺 **症状**：頭痛・倦怠感・むくみ・肌荒れ・便秘・下痢・お腹の張り・眠気・集中力低下・気分の落ち込み・冷え・めまい（カスタマイズ可）
- 📝 **メモ**：自由記述

## 使い方

### PC で試す（ローカル起動）

1. エクスプローラで `index.html` をダブルクリック
2. 既定のブラウザで開きます
3. 記録してみて、OKなら次のステップへ

### スマホで使う

**方法1：ローカルファイルを LAN 経由で開く**
- PC 上で簡易サーバーを起動し、同じ Wi-Fi からスマホでアクセス
- PC を起動しておく必要があり、やや不便

**方法2：GitHub Pages で公開（推奨）**
1. GitHub アカウントを作成（無料）
2. プライベートリポジトリを作成し、このフォルダをアップロード
3. Settings → Pages で公開設定
4. 発行された URL（例：`https://username.github.io/health-tracker/`）をスマホで開く
5. Safari / Chrome のメニューから「ホーム画面に追加」

→ セットアップが分からない場合は Claude に依頼してください。

## クラウド同期（PC ↔ スマホ）

Firebase Authentication（Googleログイン）+ Cloud Firestore で同じデータを複数端末で共有できます。

### Firebase 側のセットアップ（初回のみ）

1. [Firebase Console](https://console.firebase.google.com/) で新規プロジェクトを作成
2. **Authentication** → Sign-in method → **Google** を有効化
3. **Authentication → Settings → 承認済みドメイン** に公開URLのドメインを追加（例: `username.github.io`）
4. **Firestore Database** を作成（本番環境モード／リージョンは `asia-northeast1` 推奨）
5. **Firestore → ルール** に以下を貼り付けて公開:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
6. **プロジェクト設定 → マイアプリ → ウェブアプリ（`</>`）を追加** → 表示される `firebaseConfig` オブジェクトをコピー

### アプリ側のセットアップ（PC・スマホそれぞれ）

1. アプリの「設定」→「☁️ クラウド同期」を開く
2. コピーした `firebaseConfig` を貼り付けて「💾 設定を保存」
3. 「Googleでログイン」を押して同じGoogleアカウントでログイン
4. **初回（PC側）**: 「⬆️ クラウドに保存」でデータをアップロード
5. **2台目（スマホ側）**: ログイン後「⬇️ クラウドから読込」で同期
6. 「保存時に自動でクラウド送信／ログイン時に自動取得」をON にすれば以降は自動

### セキュリティ

- 認証はFirebase Authentication（Google ログイン）— パスワードはアプリで扱いません
- Firestore Security Rules により、ログイン中ユーザーは自分の `users/{自分のuid}` 配下のみアクセス可能
- Firebase設定（apiKey等）はブラウザのLocalStorageに保存されます。共用端末では使用しないでください
- データ競合時はタイムスタンプで新しい方を優先

## データのバックアップ

**重要**：データはブラウザに保存されているため、ブラウザのデータ削除や機種変更で消える可能性があります。定期的にバックアップしてください。

### バックアップ方法
1. 設定画面を開く
2. 「JSONでエクスポート」をタップ
3. 保存された JSON ファイルをクラウド（Google Drive / Dropbox 等）に保管

### 復元方法
1. 設定画面を開く
2. 「JSONからインポート」をタップ
3. バックアップしたファイルを選択

## ファイル構成

```
health-tracker/
├── index.html       メイン画面（1画面で3ビュー切替）
├── app.js           ロジック
├── style.css        デザイン
├── manifest.json    PWA 設定
└── README.md        このファイル
```

## セキュリティについて

- データは外部サーバーに送信されません（LocalStorage のみ使用）
- 共用デバイスで使う場合は、ブラウザのプライベートモードまたは別プロファイルでの利用を推奨します
- URL 公開時は推測困難な URL にすることで、偶発的なアクセスを減らせます

## 技術スタック

- HTML / Vanilla JavaScript / CSS（依存ライブラリなし）
- LocalStorage（データ保存）
- Web App Manifest（PWA化）

## バージョン

v1.2.0（Firebase Auth + Firestore クラウド同期対応）
