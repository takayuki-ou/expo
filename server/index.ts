import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Notion API設定
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// ミドルウェア
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Notion データベース取得エンドポイント
 * GET /api/notion/databases/:databaseId
 */
app.get('/api/notion/databases/:databaseId', async (req: Request, res: Response) => {
  const { databaseId } = req.params;
  const authToken = req.headers.authorization?.replace('Bearer ', '');

  console.log('=== Notion データベース取得リクエスト ===');
  console.log('データベースID:', databaseId);
  console.log('Authorization Token:', authToken ? `${authToken.substring(0, 10)}...` : 'なし');

  if (!authToken) {
    return res.status(401).json({
      error: 'Authorization header required',
      message: 'Notion Integration Tokenを提供してください',
    });
  }

  try {
    const url = `${NOTION_API_BASE_URL}/databases/${databaseId}`;
    console.log('Notion APIリクエスト:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
    });

    console.log('Notion APIレスポンス:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion APIエラー:', data);
      return res.status(response.status).json(data);
    }

    console.log('✓ データベース取得成功');
    res.json(data);
  } catch (error: any) {
    console.error('サーバーエラー:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Notion データベースクエリエンドポイント
 * POST /api/notion/databases/:databaseId/query
 */
app.post('/api/notion/databases/:databaseId/query', async (req: Request, res: Response) => {
  const { databaseId } = req.params;
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const queryBody = req.body;

  console.log('=== Notion データベースクエリリクエスト ===');
  console.log('データベースID:', databaseId);
  console.log('Authorization Token:', authToken ? `${authToken.substring(0, 10)}...` : 'なし');
  console.log('クエリボディ:', JSON.stringify(queryBody, null, 2));

  if (!authToken) {
    return res.status(401).json({
      error: 'Authorization header required',
      message: 'Notion Integration Tokenを提供してください',
    });
  }

  try {
    const url = `${NOTION_API_BASE_URL}/databases/${databaseId}/query`;
    console.log('Notion APIリクエスト:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify(queryBody),
    });

    console.log('Notion APIレスポンス:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion APIエラー:', data);
      return res.status(response.status).json(data);
    }

    console.log('✓ クエリ成功 - 取得件数:', data.results?.length || 0);
    res.json(data);
  } catch (error: any) {
    console.error('サーバーエラー:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Notion Proxy Server 起動');
  console.log(`📡 PORT: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('=================================');
});
