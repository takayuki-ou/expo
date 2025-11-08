# ヒートマップ可視化アプリ

Notionデータベースからデータを取得し、日付ごとのデータ数をヒートマップで可視化するReact Nativeモバイルアプリです。

## 機能

- 📊 GitHubスタイルのヒートマップ表示
- 🔌 Notionデータベースとの連携
- 📱 iOS/Android対応のクロスプラットフォームアプリ
- 🎨 モダンなダークテーマUI
- 🔄 拡張可能なデータソースアーキテクチャ

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

### 2. Notion統合の設定

1. [Notion Integrations](https://www.notion.so/my-integrations)にアクセス
2. 「新しい統合」を作成
3. API キーをコピー
4. ヒートマップ表示したいデータベースを統合に共有
5. データベースIDを取得（データベースURLの`?v=`の前の部分）

### 3. アプリの起動

```bash
# 開発サーバーを起動
npm start

# iOSで実行
npm run ios

# Androidで実行
npm run android
```

## 使い方

1. アプリを起動
2. Notion API キーとデータベースIDを入力
3. 「データを取得」ボタンをタップ
4. 過去365日のデータがヒートマップで表示されます

## 技術スタック

- **React Native** - クロスプラットフォームモバイルフレームワーク
- **Expo** - React Native開発ツール
- **TypeScript** - 型安全な開発
- **@notionhq/client** - Notion API クライアント

## 将来の拡張予定

- [ ] 複数のデータソース対応（Google Calendar、Trello、GitHub等）
- [ ] データソースの保存機能
- [ ] 期間選択機能
- [ ] カスタムカラーテーマ
- [ ] データエクスポート機能
- [ ] 統計情報の表示

## ライセンス

MIT
