import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, G, Line } from 'react-native-svg';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTextColors } from '@/context/TextColorsContext';
import { useTimeColors } from '@/hooks/useTimeColors';

type TimeRange = '1W' | '1M' | 'ALL';

interface ProgressGraphProps {
    dailyXp: { [date: string]: number };
    color?: string;
    totalXp?: number;
    currentStreak?: number;
}

const CHART_HEIGHT = 80;

function getDaysForRange(range: TimeRange, dailyXp: { [date: string]: number }, earlyStage: boolean): number {
    if (range === '1W') return 7;
    if (range === '1M') return 30;
    const dates = Object.keys(dailyXp);
    if (dates.length === 0) return earlyStage ? 21 : 90;
    const today = new Date();
    const oldest = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const diffDays = Math.floor((today.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    if (earlyStage) {
        return Math.min(Math.max(diffDays + 1, 14), 45);
    }
    return Math.min(Math.max(diffDays + 1, 30), 365);
}

export default function ProgressGraph({ dailyXp, color, totalXp, currentStreak }: ProgressGraphProps) {
    const completedDays = useMemo(
        () => Object.values(dailyXp).filter(xp => xp > 0).length,
        [dailyXp]
    );
    const accumulatedXp = useMemo(
        () => totalXp ?? Object.values(dailyXp).reduce((sum, xp) => sum + xp, 0),
        [dailyXp, totalXp]
    );
    const earlyStage = accumulatedXp < 1200 || completedDays < 10 || (currentStreak ?? 0) < 5;
    const [range, setRange] = useState<TimeRange>(earlyStage ? '1W' : '1M');
    const { textPrimary, textSecondary } = useTextColors();
    const { palette } = useTimeColors();
    const graphColor = color || textPrimary;
    const paletteStart = palette?.[0] || textPrimary;
    const paletteEnd = palette?.[palette.length - 1] || textSecondary;
    const lineGradientStart = paletteStart;
    const lineGradientEnd = paletteStart.toLowerCase() === paletteEnd.toLowerCase()
        ? (textSecondary.toLowerCase() === paletteStart.toLowerCase() ? textPrimary : textSecondary)
        : paletteEnd;
    const gradientSuffix = useMemo(() => Math.random().toString(36).slice(2, 9), []);
    const lineGradientId = `lineGrad-${gradientSuffix}`;
    const fillGradientId = `fillGrad-${gradientSuffix}`;
    const days = getDaysForRange(range, dailyXp, earlyStage);
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
                    <Text style={[styles.title, { color: graphColor }]}>VELOCITY MONITOR</Text>
                    <Text style={[styles.subtitle, { color: graphColor }]}>{days} DAY PERFORMANCE</Text>
                </View>
                <Text style={[styles.peakText, { color: graphColor }]}>PEAK: {Math.max(...data.map(d => d.xp), 0)} XP</Text>
            </View>

            <View style={styles.toggleRow}>
                {(['1W', '1M', 'ALL'] as const).map(r => (
                    <Pressable
                        key={r}
                        onPress={() => setRange(r)}
                        style={[styles.toggleBtn, range === r && [styles.toggleBtnActive, { borderColor: graphColor + '33', backgroundColor: graphColor + '10' }]]}
                    >
                        <Text style={[styles.toggleText, { color: graphColor }, range === r && [styles.toggleTextActive, { color: graphColor }]]}>{r}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.chartWrapper}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
                    <Defs>
                        <LinearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={graphColor} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={graphColor} stopOpacity="0" />
                        </LinearGradient>
                        <LinearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0" stopColor={lineGradientStart} stopOpacity="1" />
                            <Stop offset="1" stopColor={lineGradientEnd} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>

                    {/* Baseline */}
                    <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Line Chart */}
                    <Polyline
                        points={points}
                        fill="none"
                        stroke={`url(#${lineGradientId})`}
                        strokeWidth="2.5"
                        strokeLinecap="round"
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
                                        fill={item.isCurrent ? graphColor : (item.xp > 0 ? graphColor : 'rgba(255,255,255,0.1)')}
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
                    <Text style={[styles.legendText, { color: graphColor }]}>CHAINED</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={[styles.legendText, { color: graphColor }]}>MISSED</Text>
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
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.16)',
    },
    toggleText: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        letterSpacing: 1,
    },
    toggleTextActive: {
        // Will be set inline
    },
    title: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: Fonts.mono,
        fontSize: 8,
        marginTop: 2,
    },
    peakText: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
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
