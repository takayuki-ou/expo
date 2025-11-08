/**
 * データソースの種類
 */
export enum DataSourceType {
  NOTION = 'notion',
  // 将来的に追加可能: GOOGLE_CALENDAR, TRELLO, GITHUB, etc.
}

/**
 * データポイント: 日付とデータ数
 */
export interface DataPoint {
  date: string; // YYYY-MM-DD形式
  count: number;
}

/**
 * データソース接続設定
 */
export interface DataSourceConfig {
  type: DataSourceType;
  apiKey?: string;
  databaseId?: string;
  // その他の設定項目
  [key: string]: any;
}

/**
 * データソースインターフェース
 * すべてのデータソースはこのインターフェースを実装する必要があります
 */
export interface IDataSource {
  /**
   * データソースの種類を取得
   */
  getType(): DataSourceType;

  /**
   * データソースに接続できるかテスト
   */
  testConnection(): Promise<boolean>;

  /**
   * 指定期間のデータを取得
   * @param startDate 開始日（YYYY-MM-DD）
   * @param endDate 終了日（YYYY-MM-DD）
   */
  fetchData(startDate: string, endDate: string): Promise<DataPoint[]>;

  /**
   * データソースの名前を取得
   */
  getName(): string;
}
