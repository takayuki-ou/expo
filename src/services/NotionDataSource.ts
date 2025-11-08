import { Platform } from 'react-native';
import {
  IDataSource,
  DataSourceType,
  DataPoint,
  NotionInternalIntegrationConfig,
} from '../types/DataSource';

// API設定
// Web環境ではプロキシサーバー経由、モバイルではNotion API直接呼び出し
const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    // Web環境: プロキシサーバー経由
    return 'http://localhost:3001/api/notion';
  } else {
    // モバイル環境: Notion API直接
    return 'https://api.notion.com/v1';
  }
};

const NOTION_VERSION = '2022-06-28';

/**
 * Notion Internal Integrationデータソース実装
 * REST APIを直接使用して個人ワークスペースのデータベースにアクセス
 */
export class NotionDataSource implements IDataSource {
  private databaseId: string;
  private name: string;
  private integrationToken: string;

  constructor(config: NotionInternalIntegrationConfig) {
    if (!config.integrationToken) {
      throw new Error('Notion Internal Integration Tokenが必要です');
    }
    if (!config.databaseId) {
      throw new Error('Notion データベースIDが必要です');
    }

    this.databaseId = config.databaseId;
    this.integrationToken = config.integrationToken;
    this.name = config.name || 'Notion Database';
  }

  /**
   * Notion REST APIリクエストのヘッダーを生成
   * モバイル環境ではNotionVersionヘッダーも送信
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.integrationToken}`,
      'Content-Type': 'application/json',
    };

    // モバイル環境のみNotionVersionヘッダーを追加
    // Web環境ではプロキシサーバーが追加する
    if (Platform.OS !== 'web') {
      (headers as any)['Notion-Version'] = NOTION_VERSION;
    }

    return headers;
  }

  getType(): DataSourceType {
    return DataSourceType.NOTION;
  }

  getName(): string {
    return this.name;
  }

  /**
   * Notion Internal Integrationの接続をテスト
   * REST APIでデータベース情報を取得してアクセス権限を確認
   */
  async testConnection(): Promise<boolean> {
    console.log('=== Notion REST API 接続テスト開始 ===');
    console.log('プラットフォーム:', Platform.OS);
    console.log('データベースID:', this.databaseId);
    console.log('Integration Token (最初の10文字):', this.integrationToken.substring(0, 10) + '...');

    try {
      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/databases/${this.databaseId}`;
      console.log('リクエストURL:', url);
      console.log('リクエストヘッダー:', this.getHeaders());

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('HTTPステータス:', response.status);
      console.log('HTTPステータステキスト:', response.statusText);

      const responseText = await response.text();
      console.log('レスポンステキスト:', responseText);

      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        console.error('APIエラーレスポンス:', errorData);

        // Notion APIのエラーコードに応じた処理
        if (response.status === 401) {
          console.error('認証エラー: Integration Tokenが無効です');
        } else if (response.status === 404) {
          console.error('データベースが見つかりません。データベースIDを確認してください');
        } else if (response.status === 403) {
          console.error('アクセス権限エラー: Integrationがデータベースに接続されていません');
        }

        return false;
      }

      const data = JSON.parse(responseText);
      console.log('✓ Notion REST API レスポンス成功');
      console.log('レスポンス全体:', JSON.stringify(data, null, 2));
      console.log('レスポンスのキー:', Object.keys(data));

      if (data.object) {
        console.log('object type:', data.object);
      }

      if (data.id) {
        console.log('database id:', data.id);
      }

      console.log('✓ Notion Internal Integration接続成功');

      return true;
    } catch (error: any) {
      console.error('=== Notion接続テスト失敗 ===');
      console.error('エラー全体:', error);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
      console.error('エラー名:', error.name);
      console.error('エラーの型:', typeof error);

      return false;
    }
  }

  /**
   * 指定期間のデータを取得して日付ごとに集計
   * REST APIでデータベースをクエリ（ページネーション対応）
   */
  async fetchData(startDate: string, endDate: string): Promise<DataPoint[]> {
    console.log('=== Notion REST API データ取得開始 ===');
    console.log('プラットフォーム:', Platform.OS);
    console.log('開始日:', startDate);
    console.log('終了日:', endDate);
    console.log('データベースID:', this.databaseId);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/databases/${this.databaseId}/query`;
      console.log('リクエストURL:', url);

      // クエリボディ: created_timeで期間フィルタ
      const requestBody = {
        filter: {
          and: [
            {
              timestamp: 'created_time',
              created_time: {
                on_or_after: startDate,
              },
            },
            {
              timestamp: 'created_time',
              created_time: {
                on_or_before: endDate,
              },
            },
          ],
        },
        page_size: 100, // 最大100件
      };

      console.log('リクエストボディ:', JSON.stringify(requestBody, null, 2));

      const allPages: any[] = [];
      let hasMore = true;
      let startCursor: string | undefined = undefined;

      // ページネーション処理
      while (hasMore) {
        const body = startCursor
          ? { ...requestBody, start_cursor: startCursor }
          : requestBody;

        console.log('データベースクエリ実行中...');
        console.log('start_cursor:', startCursor || 'なし');

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        });

        console.log('HTTPステータス:', response.status);
        console.log('HTTPステータステキスト:', response.statusText);

        const responseText = await response.text();

        if (!response.ok) {
          console.error('APIエラーレスポンス:', responseText);
          const errorData = JSON.parse(responseText);

          if (response.status === 401) {
            throw new Error('認証エラー: Integration Tokenが無効です');
          } else if (response.status === 404) {
            throw new Error('データベースが見つかりません');
          } else if (response.status === 403) {
            throw new Error('アクセス権限エラー: Integrationがデータベースに接続されていません');
          } else {
            throw new Error(`API Error: ${errorData.message || response.statusText}`);
          }
        }

        const data = JSON.parse(responseText);
        console.log('✓ Notion REST API クエリレスポンス成功');
        console.log('レスポンスのキー:', Object.keys(data));
        console.log('今回取得したページ数:', data.results?.length || 0);
        console.log('has_more:', data.has_more);
        console.log('next_cursor:', data.next_cursor || 'なし');

        if (data.results && data.results.length > 0) {
          console.log('最初のページサンプル:', JSON.stringify(data.results[0], null, 2));
          allPages.push(...data.results);
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      console.log('全ページ取得完了。合計:', allPages.length);

      // 日付ごとにデータを集計
      const dateCountMap = new Map<string, number>();

      allPages.forEach((page: any, index: number) => {
        console.log(`ページ ${index + 1}:`, {
          id: page.id,
          created_time: page.created_time,
          object: page.object,
        });

        const createdTime = page.created_time;
        const dateOnly = createdTime.split('T')[0]; // YYYY-MM-DD形式に変換

        const currentCount = dateCountMap.get(dateOnly) || 0;
        dateCountMap.set(dateOnly, currentCount + 1);
      });

      console.log('日付ごとの集計:', Array.from(dateCountMap.entries()));

      // Map を DataPoint[] に変換
      const dataPoints: DataPoint[] = Array.from(dateCountMap.entries()).map(
        ([date, count]) => ({
          date,
          count,
        })
      );

      // 日付順にソート
      dataPoints.sort((a, b) => a.date.localeCompare(b.date));

      console.log('最終的なデータポイント:', dataPoints);
      console.log('=== Notion REST API データ取得完了 ===');

      return dataPoints;
    } catch (error: any) {
      console.error('=== Notionデータ取得エラー ===');
      console.error('エラー全体:', error);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
      console.error('エラー名:', error.name);
      console.error('エラーの型:', typeof error);

      throw new Error('Notionからデータを取得できませんでした: ' + error.message);
    }
  }
}
