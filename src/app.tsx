import React, { type FC, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/components/button';
import { HeatmapView } from '@/components/HeatmapView';
import { NotionDataSource } from '@/services/NotionDataSource';
import { DataSourceType, type DataPoint } from '@/types/DataSource';

/**
 * プラットフォームに応じたアラート表示
 */
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const App: FC = () => {
  const [integrationToken, setIntegrationToken] = useState<string>('');
  const [databaseId, setDatabaseId] = useState<string>('');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  /**
   * データを取得してヒートマップを表示
   */
  const handleFetchData = async () => {
    // Web環境での注意（プロキシサーバー使用）
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Web環境で実行中\n\n' +
        'プロキシサーバー (http://localhost:3001) を使用します。\n' +
        'サーバーが起動していることを確認してください。\n\n' +
        '別ターミナルで以下を実行:\n' +
        '  npm run server\n\n' +
        '続行しますか?'
      );
      if (!confirmed) return;
    }

    if (!integrationToken.trim() || !databaseId.trim()) {
      showAlert(
        'エラー',
        'Notion Internal Integration TokenとデータベースIDを入力してください'
      );
      return;
    }

    setLoading(true);
    try {
      // Internal Integrationデータソースを作成
      const dataSource = new NotionDataSource({
        type: DataSourceType.NOTION,
        integrationToken: integrationToken.trim(),
        databaseId: databaseId.trim(),
        name: 'My Notion Database',
      });

      // 接続テスト & 権限確認
      const connectionOk = await dataSource.testConnection();
      if (!connectionOk) {
        showAlert(
          'エラー',
          'Notionへの接続に失敗しました。\n\n以下を確認してください:\n• Integration Tokenが正しいか\n• データベースIDが正しいか\n• IntegrationがデータベースにConnectされているか'
        );
        setLoading(false);
        return;
      }

      setIsConnected(true);

      // 過去365日のデータを取得
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

      const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      const fetchedData = await dataSource.fetchData(
        formatDate(startDate),
        formatDate(endDate)
      );

      setData(fetchedData);
      showAlert('成功', `${fetchedData.length}件のデータポイントを取得しました`);
    } catch (error) {
      console.error('データ取得エラー:', error);
      showAlert('エラー', 'データの取得に失敗しました: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * リセット
   */
  const handleReset = () => {
    setIntegrationToken('');
    setDatabaseId('');
    setData([]);
    setIsConnected(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>📊 ヒートマップ可視化アプリ</Text>
        <Text style={styles.subtitle}>Notionデータベースからデータを取得</Text>

        {/* 設定フォーム */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Internal Integration Token</Text>
          <Text style={styles.helpText}>
            Notion Internal Integrationで生成されたトークン
          </Text>
          <TextInput
            style={styles.input}
            placeholder="secret_XXXXXXXXXX..."
            placeholderTextColor="#666"
            value={integrationToken}
            onChangeText={setIntegrationToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
          />

          <Text style={styles.label}>データベースID</Text>
          <Text style={styles.helpText}>
            ヒートマップ表示したいNotionデータベースのID
          </Text>
          <TextInput
            style={styles.input}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            placeholderTextColor="#666"
            value={databaseId}
            onChangeText={setDatabaseId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ボタン */}
          <View style={styles.buttonGroup}>
            {!isConnected ? (
              <Button
                label={loading ? '取得中...' : 'データを取得'}
                theme="primary"
                onPress={handleFetchData}
                disabled={loading}
              />
            ) : (
              <>
                <Button
                  label="再取得"
                  theme="primary"
                  onPress={handleFetchData}
                  disabled={loading}
                />
                <Button label="リセット" onPress={handleReset} disabled={loading} />
              </>
            )}
          </View>
        </View>

        {/* ローディング */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>データを取得中...</Text>
          </View>
        )}

        {/* ヒートマップ */}
        {!loading && data.length > 0 && (
          <View style={styles.heatmapWrapper}>
            <HeatmapView data={data} />
          </View>
        )}

        {/* データがない場合 */}
        {!loading && isConnected && data.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              データが見つかりませんでした。{'\n'}
              過去365日以内にデータベースにアイテムを追加してください。
            </Text>
          </View>
        )}

        {/* Web環境での情報 */}
        {Platform.OS === 'web' && !isConnected && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>💡 Web環境で動作中</Text>
            <Text style={styles.infoText}>
              CORS制限を回避するため、プロキシサーバー経由でNotion APIにアクセスします。
              {'\n\n'}
              <Text style={styles.guideBold}>サーバー起動手順:</Text>
              {'\n\n'}
              1. 別のターミナルを開く{'\n'}
              2. 「npm run server」を実行{'\n'}
              3. サーバーが起動したことを確認{'\n'}
              4. このページで「データを取得」をクリック
              {'\n\n'}
              <Text style={styles.guideBold}>推奨: モバイルアプリとして使用</Text>
              {'\n'}
              • より高速で安定した動作{'\n'}
              • プロキシサーバー不要
            </Text>
          </View>
        )}

        {/* 使い方ガイド */}
        {Platform.OS !== 'web' && !isConnected && (
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>📝 セットアップガイド</Text>
            <Text style={styles.guideText}>
              {'\n'}
              <Text style={styles.guideBold}>1. Internal Integrationを作成</Text>
              {'\n'}
              • Notion設定 → 統合 → 新しい統合を作成{'\n'}
              • タイプ: Internal Integration を選択{'\n'}
              • トークンをコピー
              {'\n\n'}
              <Text style={styles.guideBold}>2. データベースに接続</Text>
              {'\n'}
              • 対象のNotionデータベースを開く{'\n'}
              • 右上の「...」→ 接続 → 作成した統合を選択{'\n'}
              • データベースIDをURLからコピー
              {'\n\n'}
              <Text style={styles.guideBold}>3. アプリで認証</Text>
              {'\n'}
              • 上記フォームにトークンとIDを入力{'\n'}
              • 「データを取得」をタップ
              {'\n\n'}
              ※ Internal Integrationは個人ワークスペース専用です
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    marginTop: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  heatmapWrapper: {
    marginBottom: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  guideContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  guideText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  guideBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    backgroundColor: '#1a2a3a',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#a8d5e2',
    lineHeight: 22,
  },
});

registerRootComponent(App);

export default App;
