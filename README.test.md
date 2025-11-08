# テストについて

このプロジェクトには、Notionデータ取得ボタンの挙動をテストするためのテストスイートが含まれています。

## テストの実行

```bash
# 全テストを実行
npm test

# カバレッジを確認
npm run test:coverage

# ウォッチモードで実行
npm run test:watch
```

## テスト対象

`src/__tests__/app.test.tsx` にて、以下のシナリオをテストしています:

1. **バリデーション**
   - APIキーとデータベースIDが空の場合、エラーアラートを表示
   - APIキーのみが空の場合、エラーアラートを表示
   - データベースIDのみが空の場合、エラーアラートを表示

2. **Notion API連携**
   - 接続テストが失敗した場合、エラーアラートを表示
   - データ取得が成功した場合、成功アラートを表示

3. **UI挙動**
   - ローディング中はボタンのラベルが「取得中...」に変わる
   - データ取得成功後、「再取得」と「リセット」ボタンが表示される
   - リセットボタンを押すと、入力値とデータがクリアされる

4. **エラーハンドリング**
   - データ取得中にエラーが発生した場合、エラーアラートを表示

## モックについて

テストでは以下をモックしています:

- **Notion APIクライアント** (`@notionhq/client`)
  - `databases.retrieve()` - 接続テスト用
  - `databases.query()` - データ取得用

- **React Nativeコンポーネント**
  - `Alert.alert()` - アラート表示の検証用
  - Expo関連モジュール
  - ベクターアイコン

## テスト環境の設定

テストは以下の設定で実行されます:

- **Jest**: テストランナー
- **React Native Testing Library**: コンポーネントのテスト
- **@react-native/babel-preset**: Babel設定

設定ファイル:
- `jest.config.js`: Jest設定
- `jest.setup.js`: テスト環境のセットアップ
- `babel.config.js`: Babel設定

## 注意事項

React Nativeアプリのテストには、ネイティブモジュールのモックが必要です。
現在のテスト環境では、React Native Testing Libraryの一部の機能に制約があります。

詳細な実装については `src/__tests__/app.test.tsx` を参照してください。
