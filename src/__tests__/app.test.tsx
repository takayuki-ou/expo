import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../app';

// Notion APIクライアントのモック
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      databases: {
        retrieve: jest.fn(),
        query: jest.fn(),
      },
    })),
  };
});

// NotionDataSourceのモック
jest.mock('../services/NotionDataSource', () => {
  const mockTestConnection = jest.fn();
  const mockFetchData = jest.fn();

  return {
    NotionDataSource: jest.fn().mockImplementation(() => ({
      testConnection: mockTestConnection,
      fetchData: mockFetchData,
      getType: jest.fn(() => 'notion'),
      getName: jest.fn(() => 'Test Database'),
    })),
    __mockTestConnection: mockTestConnection,
    __mockFetchData: mockFetchData,
  };
});

describe('App - データを取得ボタンの挙動', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('APIキーとデータベースIDが空の場合、エラーアラートを表示する', async () => {
    const { getByText } = render(<App />);

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'エラー',
      'Notion API キーとデータベースIDを入力してください'
    );
  });

  it('APIキーのみが空の場合、エラーアラートを表示する', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'エラー',
      'Notion API キーとデータベースIDを入力してください'
    );
  });

  it('データベースIDのみが空の場合、エラーアラートを表示する', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    fireEvent.changeText(apiKeyInput, 'secret_test_key');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'エラー',
      'Notion API キーとデータベースIDを入力してください'
    );
  });

  it('接続テストが失敗した場合、エラーアラートを表示する', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});
    mockInstance.testConnection.mockResolvedValue(false);

    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        'Notionへの接続に失敗しました。API キーとデータベースIDを確認してください'
      );
    });
  });

  it('データ取得が成功した場合、成功アラートを表示する', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});

    // 接続テストを成功させる
    mockInstance.testConnection.mockResolvedValue(true);

    // データ取得を成功させる
    const mockData = [
      { date: '2025-01-01', count: 3 },
      { date: '2025-01-02', count: 5 },
      { date: '2025-01-03', count: 2 },
    ];
    mockInstance.fetchData.mockResolvedValue(mockData);

    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    await waitFor(() => {
      expect(mockInstance.testConnection).toHaveBeenCalled();
      expect(mockInstance.fetchData).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        '成功',
        '3件のデータポイントを取得しました'
      );
    });
  });

  it('ローディング中はボタンのラベルが「取得中...」に変わる', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});

    // 接続テストを遅延させる
    mockInstance.testConnection.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    mockInstance.fetchData.mockResolvedValue([]);

    const { getByText, getByPlaceholderText, queryByText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    // ローディング中の表示を確認
    await waitFor(() => {
      expect(queryByText('取得中...')).toBeTruthy();
    });

    // ローディング完了後の表示を確認
    await waitFor(() => {
      expect(queryByText('データを取得') || queryByText('再取得')).toBeTruthy();
    });
  });

  it('データ取得中にエラーが発生した場合、エラーアラートを表示する', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});

    mockInstance.testConnection.mockResolvedValue(true);
    mockInstance.fetchData.mockRejectedValue(new Error('ネットワークエラー'));

    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        expect.stringContaining('データの取得に失敗しました')
      );
    });
  });

  it('データ取得成功後、「再取得」と「リセット」ボタンが表示される', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});

    mockInstance.testConnection.mockResolvedValue(true);
    mockInstance.fetchData.mockResolvedValue([
      { date: '2025-01-01', count: 1 },
    ]);

    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    await waitFor(() => {
      expect(getByText('再取得')).toBeTruthy();
      expect(getByText('リセット')).toBeTruthy();
    });
  });

  it('リセットボタンを押すと、入力値とデータがクリアされる', async () => {
    const NotionDataSource = require('../services/NotionDataSource').NotionDataSource;
    const mockInstance = new NotionDataSource({});

    mockInstance.testConnection.mockResolvedValue(true);
    mockInstance.fetchData.mockResolvedValue([
      { date: '2025-01-01', count: 1 },
    ]);

    const { getByText, getByPlaceholderText } = render(<App />);

    const apiKeyInput = getByPlaceholderText('secret_XXXXXXXXXX...');
    const databaseIdInput = getByPlaceholderText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    fireEvent.changeText(apiKeyInput, 'secret_test_key');
    fireEvent.changeText(databaseIdInput, 'test-database-id');

    const fetchButton = getByText('データを取得');
    fireEvent.press(fetchButton);

    await waitFor(() => {
      expect(getByText('リセット')).toBeTruthy();
    });

    const resetButton = getByText('リセット');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText('データを取得')).toBeTruthy();
      // 入力値がクリアされていることを確認
      expect((apiKeyInput as any).props.value).toBe('');
      expect((databaseIdInput as any).props.value).toBe('');
    });
  });
});
