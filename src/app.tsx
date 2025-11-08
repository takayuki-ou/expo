import { type FC, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/componets/button';
import { HeatmapView } from '@/components/HeatmapView';
import { NotionDataSource } from '@/services/NotionDataSource';
import { DataSourceType, type DataPoint } from '@/types/DataSource';

const App: FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [databaseId, setDatabaseId] = useState<string>('');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  /**
   * データを取得してヒートマップを表示
   */
  const handleFetchData = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      Alert.alert('エラー', 'Notion API キーとデータベースIDを入力してください');
      return;
    }

    setLoading(true);
    try {
      // データソースを作成
      const dataSource = new NotionDataSource({
        type: DataSourceType.NOTION,
        apiKey: apiKey.trim(),
        databaseId: databaseId.trim(),
        name: 'My Notion Database',
      });

      // 接続テスト
      const connectionOk = await dataSource.testConnection();
      if (!connectionOk) {
        Alert.alert('エラー', 'Notionへの接続に失敗しました。API キーとデータベースIDを確認してください');
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
      Alert.alert('成功', `${fetchedData.length}件のデータポイントを取得しました`);
    } catch (error) {
      console.error('データ取得エラー:', error);
      Alert.alert('エラー', 'データの取得に失敗しました: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * リセット
   */
  const handleReset = () => {
    setApiKey('');
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
          <Text style={styles.label}>Notion API キー</Text>
          <TextInput
            style={styles.input}
            placeholder="secret_XXXXXXXXXX..."
            placeholderTextColor="#666"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
          />

          <Text style={styles.label}>データベースID</Text>
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
              />
            ) : (
              <>
                <Button
                  label="再取得"
                  theme="primary"
                  onPress={handleFetchData}
                />
                <Button label="リセット" onPress={handleReset} />
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

        {/* 使い方ガイド */}
        {!isConnected && (
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>使い方</Text>
            <Text style={styles.guideText}>
              1. Notionで統合を作成してAPI キーを取得{'\n'}
              2. ヒートマップ表示したいデータベースのIDを取得{'\n'}
              3. 上記の情報を入力して「データを取得」をタップ{'\n'}
              4. データベース内のアイテムの作成日がヒートマップに表示されます
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
    marginBottom: 8,
    marginTop: 12,
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
});

registerRootComponent(App);
