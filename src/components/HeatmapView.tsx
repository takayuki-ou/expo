import React, { type FC, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DataPoint } from '../types/DataSource';

interface HeatmapViewProps {
  data: DataPoint[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * GitHubスタイルのヒートマップコンポーネント
 */
export const HeatmapView: FC<HeatmapViewProps> = ({ data, startDate, endDate }) => {
  const { weeks, maxCount } = useMemo(() => {
    // デフォルト: 過去365日
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    // データをマップに変換
    const dataMap = new Map<string, number>();
    let max = 0;
    data.forEach((point) => {
      dataMap.set(point.date, point.count);
      max = Math.max(max, point.count);
    });

    // 週ごとに日付を配列化
    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    const currentDate = new Date(start);

    // 開始日の曜日まで空白を追加
    const startDayOfWeek = currentDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: '', count: 0 });
    }

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) || 0;

      currentWeek.push({ date: dateStr, count });

      if (currentDate.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 最後の週を追加
    if (currentWeek.length > 0) {
      // 残りの曜日を空白で埋める
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: 0 });
      }
      weeks.push(currentWeek);
    }

    return { weeks, maxCount: max };
  }, [data, startDate, endDate]);

  /**
   * カウント数に応じた色を取得
   */
  const getColorForCount = (count: number): string => {
    if (count === 0) return '#ebedf0';
    if (maxCount === 0) return '#ebedf0';

    const intensity = count / maxCount;
    if (intensity < 0.25) return '#9be9a8';
    if (intensity < 0.5) return '#40c463';
    if (intensity < 0.75) return '#30a14e';
    return '#216e39';
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>アクティビティヒートマップ</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.heatmapContainer}>
          {/* 曜日ラベル */}
          <View style={styles.weekDayLabels}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* ヒートマップグリッド */}
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: day.date
                          ? getColorForCount(day.count)
                          : 'transparent',
                      },
                    ]}
                  >
                    {/* デバッグ用: カウントを表示する場合はコメントを外す */}
                    {/* {day.count > 0 && (
                      <Text style={styles.cellText}>{day.count}</Text>
                    )} */}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>少ない</Text>
        <View style={styles.legendColors}>
          <View style={[styles.legendCell, { backgroundColor: '#ebedf0' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#9be9a8' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#40c463' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#30a14e' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#216e39' }]} />
        </View>
        <Text style={styles.legendText}>多い</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#24292e',
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  weekDayLabels: {
    marginRight: 8,
    justifyContent: 'space-around',
  },
  weekDayLabel: {
    fontSize: 10,
    color: '#586069',
    height: 12,
    lineHeight: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  week: {
    gap: 3,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 6,
    color: '#fff',
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  legendText: {
    fontSize: 12,
    color: '#586069',
    marginHorizontal: 4,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 3,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
