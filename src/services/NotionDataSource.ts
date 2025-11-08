import { Client } from '@notionhq/client';
import {
  IDataSource,
  DataSourceType,
  DataPoint,
  DataSourceConfig,
} from '../types/DataSource';

/**
 * Notionデータソース実装
 */
export class NotionDataSource implements IDataSource {
  private client: Client;
  private databaseId: string;
  private name: string;

  constructor(config: DataSourceConfig) {
    if (!config.apiKey) {
      throw new Error('Notion API キーが必要です');
    }
    if (!config.databaseId) {
      throw new Error('Notion データベースIDが必要です');
    }

    this.client = new Client({ auth: config.apiKey });
    this.databaseId = config.databaseId;
    this.name = config.name || 'Notion Database';
  }

  getType(): DataSourceType {
    return DataSourceType.NOTION;
  }

  getName(): string {
    return this.name;
  }

  /**
   * Notion APIへの接続をテスト
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.databases.retrieve({
        database_id: this.databaseId,
      });
      return true;
    } catch (error) {
      console.error('Notion接続テスト失敗:', error);
      return false;
    }
  }

  /**
   * 指定期間のデータを取得して日付ごとに集計
   */
  async fetchData(startDate: string, endDate: string): Promise<DataPoint[]> {
    try {
      // Notionデータベースからページを取得
       
      const response = await (this.client.databases as any).query({
        database_id: this.databaseId,
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
      });

      // 日付ごとにデータを集計
      const dateCountMap = new Map<string, number>();

      response.results.forEach((page: any) => {
        const createdTime = page.created_time;
        const dateOnly = createdTime.split('T')[0]; // YYYY-MM-DD形式に変換

        const currentCount = dateCountMap.get(dateOnly) || 0;
        dateCountMap.set(dateOnly, currentCount + 1);
      });

      // Map を DataPoint[] に変換
      const dataPoints: DataPoint[] = Array.from(dateCountMap.entries()).map(
        ([date, count]) => ({
          date,
          count,
        })
      );

      // 日付順にソート
      dataPoints.sort((a, b) => a.date.localeCompare(b.date));

      return dataPoints;
    } catch (error) {
      console.error('Notionデータ取得エラー:', error);
      throw new Error('Notionからデータを取得できませんでした');
    }
  }
}
