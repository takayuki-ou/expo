# 📊 Notionヒートマップ可視化アプリ

Notionデータベースのアイテム作成日時をヒートマップで可視化するReact Nativeアプリです。

## ✨ 機能

- 📊 GitHubスタイルのヒートマップ表示
- 🔌 Notion Internal Integrationを使用したデータベース連携
- 📱 iOS/Android対応のクロスプラットフォームアプリ
- 🎨 モダンなダークテーマUI
- 🔄 拡張可能なデータソースアーキテクチャ

## 🌐 プラットフォーム対応

### モバイルアプリ (推奨)

- **iOS** (実機/シミュレータ)
- **Android** (実機/エミュレータ)
- **Expo Go** アプリ

モバイル環境では、Notion APIに直接アクセスします。最も高速で安定した動作が可能です。

### Web環境

Web環境でも動作可能ですが、プロキシサーバーが必要です:

1. **CORS制限**: Notion APIはブラウザからの直接アクセスを許可していません
2. **解決策**: ローカルプロキシサーバー経由でAPIコール
3. **手順**: 別ターミナルで `npm run server` を実行

## アーキテクチャ

### データソースの抽象化

将来的に複数のデータソース（Google Calendar、Trello、GitHubなど）を追加できるよう、データソースを抽象化しています。

```
src/
  types/
    DataSource.ts          # データソースのインターフェース定義
  services/
    NotionDataSource.ts    # Notion実装
  components/
    HeatmapView.tsx        # ヒートマップコンポーネント
  app.tsx                  # メインアプリ
```

### 主要な型定義

```typescript
// データソースインターフェース
interface IDataSource {
  getType(): DataSourceType;
  testConnection(): Promise<boolean>;
  fetchData(startDate: string, endDate: string): Promise<DataPoint[]>;
  getName(): string;
}

// データポイント
interface DataPoint {
  date: string;  // YYYY-MM-DD形式
  count: number; // その日のデータ数
}
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Notion Internal Integrationの作成

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「新しい統合を作成」をクリック
3. **タイプ: Internal Integration** を選択
4. 名前を入力して作成
5. **Internal Integration Token** をコピー（`secret_...`で始まる文字列）

### 3. データベースへの接続

1. ヒートマップ表示したいNotionデータベースを開く
2. 右上の「**...**」メニュー → 「**接続**」を選択
3. 作成した統合を選択
4. データベースのURLからIDをコピー
   - URL例: `https://notion.so/xxxxx?v=yyyyy`
   - `xxxxx` 部分（ハイフンなし32文字）がデータベースID

### 4. アプリの起動

#### モバイルアプリとして起動 (推奨)

```bash
npm start
```

1. Expo Goアプリをインストール
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. ターミナルに表示されたQRコードをスキャン

3. アプリが起動したら:
   - Internal Integration Token を入力
   - データベースID を入力
   - 「データを取得」をタップ

#### Web環境で起動

Web環境で実行する場合は、プロキシサーバーが必要です:

**ターミナル1 (プロキシサーバー):**
```bash
npm run server
```

**ターミナル2 (Webアプリ):**
```bash
npm run web
```

ブラウザで http://localhost:8081 にアクセス

## 🏗️ 技術スタック

### Notion API統合

- **SDK不使用**: `@notionhq/client` パッケージは使用していません
- **REST API直接呼び出し**: React Nativeネイティブの`fetch` APIを使用
- **プラットフォーム別実装**:
  - モバイル: Notion API直接呼び出し (`https://api.notion.com/v1`)
  - Web: プロキシサーバー経由 (`http://localhost:3001/api/notion`)
- **エンドポイント**:
  - `GET /v1/databases/{database_id}` - 接続テスト
  - `POST /v1/databases/{database_id}/query` - データ取得
- **ページネーション対応**: 100件以上のデータも自動取得

### 主要技術

**フロントエンド:**
- React Native + Expo
- TypeScript
- React Native Web (Web対応)

**バックエンド (Webプロキシ):**
- Express + TypeScript
- CORS対応
- Notion REST API (v2022-06-28)

## 🐛 トラブルシューティング

### Web環境でCORSエラーが発生する

→ プロキシサーバーが起動していません。別ターミナルで `npm run server` を実行してください。

### プロキシサーバーに接続できない

1. サーバーが正常に起動しているか確認
2. ポート3001が使用可能か確認
3. ブラウザで http://localhost:3001/api/health にアクセスして確認

### 「認証エラー」が発生する

→ Integration Tokenが正しいか確認してください（`secret_`で始まる必要があります）

### 「データベースが見つかりません」

→ データベースIDが正しいか確認してください（ハイフンなし32文字）

### 「アクセス権限エラー」

→ IntegrationがデータベースにConnectされているか確認してください

### モバイルアプリでエラーが発生する

→ モバイル環境ではプロキシサーバー不要です。サーバーを停止して、アプリを再起動してください。

## 🔒 セキュリティ

- Internal Integration Tokenはアプリ内のみで使用
- トークンは外部に送信されません（Notion API直接通信のみ）
- セキュアテキスト入力で表示を隠す

## 🚀 将来の拡張予定

- [ ] 複数のデータソース対応（Google Calendar、Trello、GitHub等）
- [ ] データソースの保存機能
- [ ] 期間選択機能
- [ ] カスタムカラーテーマ
- [ ] データエクスポート機能
- [ ] 統計情報の表示

## ライセンス

MIT
