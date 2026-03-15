import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, G, Line } from 'react-native-svg';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type TimeRange = '1W' | '1M' | 'ALL';

interface ProgressGraphProps {
    dailyXp: { [date: string]: number };
    color?: string;
}

const CHART_HEIGHT = 80;

function getDaysForRange(range: TimeRange, dailyXp: { [date: string]: number }): number {
    if (range === '1W') return 7;
    if (range === '1M') return 30;
    const dates = Object.keys(dailyXp);
    if (dates.length === 0) return 90;
    const today = new Date();
    const oldest = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const diffDays = Math.floor((today.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diffDays + 1, 30), 365);
}

export default function ProgressGraph({ dailyXp, color = Colors.accentPrimary }: ProgressGraphProps) {
    const [range, setRange] = useState<TimeRange>('1M');
    const days = getDaysForRange(range, dailyXp);
    const { width: screenWidth } = useWindowDimensions();
    const CHART_WIDTH = Math.max(200, screenWidth - (Spacing.lg * 2) - 64);
    const data = useMemo(() => {
        const today = new Date();
        const results = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            results.push({
                date: dateStr,
                xp: dailyXp[dateStr] || 0,
                isCurrent: i === 0
            });
        }
        return results;
    }, [dailyXp, days]);

    const maxXP = Math.max(...data.map(d => d.xp), 150);
    const stepX = days > 1 ? CHART_WIDTH / (days - 1) : CHART_WIDTH;

    // Generate points for the Polyline
    const points = data.map((item, i) => {
        const x = i * stepX;
        const y = CHART_HEIGHT - (item.xp / maxXP) * CHART_HEIGHT;
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>VELOCITY MONITOR</Text>
                    <Text style={styles.subtitle}>{days} DAY PERFORMANCE</Text>
                </View>
                <Text style={styles.peakText}>PEAK: {Math.max(...data.map(d => d.xp), 0)} XP</Text>
            </View>

            <View style={styles.toggleRow}>
                {(['1W', '1M', 'ALL'] as const).map(r => (
                    <Pressable
                        key={r}
                        onPress={() => setRange(r)}
                        style={[styles.toggleBtn, range === r && [styles.toggleBtnActive, { borderColor: color + '66', backgroundColor: color + '22' }]]}
                    >
                        <Text style={[styles.toggleText, range === r && [styles.toggleTextActive, { color }]]}>{r}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.chartWrapper}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={color} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Baseline */}
                    <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Line Chart */}
                    <Polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                    />

                    {/* Data Points + Streak Chain */}
                    <G>
                        {data.map((item, i) => {
                            const x = i * stepX;
                            const y = CHART_HEIGHT - (item.xp / maxXP) * CHART_HEIGHT;
                            const isMissed = item.xp === 0 && !item.isCurrent;

                            return (
                                <React.Fragment key={item.date}>
                                    {/* XP Node */}
                                    <Circle
                                        cx={x}
                                        cy={y}
                                        r={item.isCurrent ? 4 : 3}
                                        fill={item.isCurrent ? color : (item.xp > 0 ? color : 'rgba(255,255,255,0.1)')}
                                        stroke={Colors.bgPrimary}
                                        strokeWidth={1}
                                    />

                                    {/* Streak Chain Marker */}
                                    <Circle
                                        cx={x}
                                        cy={CHART_HEIGHT + 20}
                                        r={3}
                                        fill={isMissed ? '#FF3B30' : (item.xp > 0 ? '#34C759' : 'rgba(255,255,255,0.05)')}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </G>
                </Svg>
            </View>

            <View style={styles.footer}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
                    <Text style={styles.legendText}>CHAINED</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={styles.legendText}>MISSED</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    toggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: Radius.pill,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    toggleText: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    title: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: Fonts.mono,
        fontSize: 8,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 2,
    },
    peakText: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
    },
    chartWrapper: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 20,
        marginTop: 12,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontFamily: Fonts.mono,
        fontSize: 8,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    }
});
