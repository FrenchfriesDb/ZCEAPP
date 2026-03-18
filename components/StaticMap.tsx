import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Fonts, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

interface StaticMapProps {
    dailyXp: { [date: string]: number };
    drillLogs?: any[];
}

const SQUARE_SIZE = 28;
const GAPPING = 8;
const GRID_SIZE = 7; // Standard 7-day week
const WEEKS_PER_PAGE = 7;
const DAYS_PER_PAGE = GRID_SIZE * WEEKS_PER_PAGE;
const PAGES_IN_FUTURE = 1;
const PAGES_IN_PAST = 3;

const ROASTS = {
    npc: [
        "Total blackout. The engine didn't even turn over.",
        "Zero reps. 100% excuses. This isn't how you build aura.",
        "Hidden in the shadows? No, you're just hiding.",
        "Ghost mode isn't a strategy when it's just laziness.",
        "Are you waiting for permission to be high-status? It's not coming."
    ],
    warmup: [
        "Barely moving. A light tickle of effort.",
        "The signal is weak. You need to boost the amplitude.",
        "Participation trophies don't exist in the Dojo.",
        "Is this a hobby or a mission? Your effort says 'hobby'.",
        "Low-frequency output. Tune in or tune out."
    ],
    signal: [
        "Solid frequency. The engine is warm.",
        "Movement detected. Logic is starting to flow.",
        "Acceptable volume. Keep the pressure on.",
        "You're in the game, but you aren't winning yet.",
        "Found the rhythm. Now accelerate."
    ],
    static: [
        "High static. You're disrupting the average.",
        "Strong signal lock. You're becoming the focal point.",
        "Magnetic output. People are starting to notice.",
        "Architect-level effort. The infrastructure is solid.",
        "Relentless. This is where the gap widens."
    ],
    aura: [
        "MAXIMUM AURA. You are the engine.",
        "Total system dominance. 10/10 Intensity.",
        "Void Spark territory. You're rewriting the protocol.",
        "Absolute Static. Everyone else is just noise.",
        "Legend-la. This is the blueprint."
    ]
};

const StaticMap: React.FC<StaticMapProps> = ({ dailyXp, drillLogs = [] }) => {
    const pageWidth = Dimensions.get('window').width - 64;
    const gridDim = GRID_SIZE * (SQUARE_SIZE + GAPPING) - GAPPING;

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, [dailyXp]);

    const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
    const [activePage, setActivePage] = useState(PAGES_IN_PAST);
    const scrollRef = useRef<FlatList>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollRef.current?.scrollToIndex({ index: PAGES_IN_PAST, animated: false });
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    const pagesData = useMemo(() => {
        const pages: any[] = [];
        const epoch = new Date(2025, 11, 22);
        const today = new Date();
        const diffDays = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - epoch.getTime()) / (1000 * 3600 * 24));
        const currentBlockIndex = Math.floor(diffDays / DAYS_PER_PAGE);

        for (let p = -PAGES_IN_PAST; p <= PAGES_IN_FUTURE; p++) {
            const blockIndex = currentBlockIndex + p;
            const pageGrid: { date: string, xp: number, x: number, y: number }[] = [];

            const blockStartDate = new Date(epoch);
            blockStartDate.setDate(blockStartDate.getDate() + (blockIndex * DAYS_PER_PAGE));

            const tempDate = new Date(blockStartDate);
            for (let r = 0; r < WEEKS_PER_PAGE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const dateKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
                    pageGrid.push({
                        date: dateKey,
                        xp: dailyXp[dateKey] || 0,
                        x: c * (SQUARE_SIZE + GAPPING),
                        y: r * (SQUARE_SIZE + GAPPING),
                    });
                    tempDate.setDate(tempDate.getDate() + 1);
                }
            }
            pages.push({
                id: `page-${blockIndex}`,
                grid: pageGrid,
                type: p < 0 ? 'past' : (p === 0 ? 'current' : 'future')
            });
        }
        return pages;
    }, [dailyXp]);

    const getSquareColor = (xp: number, date: string) => {
        const isSelected = selectedDate === date;
        if (date > todayStr) return 'rgba(255,255,255,0.01)';

        if (xp === 0) return isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)';

        if (xp >= 1000) return '#D3321D';
        if (xp >= 500) return '#FF9500';
        if (xp >= 151) return '#FFCF67';
        if (xp >= 51) return '#8E8651';
        if (xp >= 1) return '#2A291E';

        return '#0A0A0A';
    };

    const analysis = useMemo(() => {
        if (!selectedDate) return null;
        const xp = dailyXp[selectedDate] || 0;
        const isFuture = selectedDate > todayStr;

        if (isFuture) return { xp: 0, comment: "Training projection: The future is yours to script. Prepare your next move.", formattedDate: "SIGNAL FLOW", dayLogs: [] };

        const dayLogs = (drillLogs || []).filter(log => {
            if (!log.date) return false;
            const d = new Date(log.date);
            const logDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return logDate === selectedDate;
        });

        let pool = ROASTS.npc;
        if (xp >= 1000) pool = ROASTS.aura;
        else if (xp >= 500) pool = ROASTS.static;
        else if (xp >= 50) pool = ROASTS.signal;
        else if (xp > 0) pool = ROASTS.warmup;

        const seed = selectedDate.split('-').reduce((a, b) => a + parseInt(b), 0);
        const comment = pool[seed % pool.length];

        const parts = selectedDate.split('-');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const formattedDate = `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;

        return { xp, comment, formattedDate, dayLogs };
    }, [selectedDate, dailyXp, drillLogs, todayStr]);

    const renderPage = ({ item }: { item: { id: string, grid: any[] } }) => (
        <View style={[styles.pageContainer, { width: pageWidth }]}>
            <Svg width={gridDim} height={gridDim} viewBox={`0 0 ${gridDim} ${gridDim}`}>
                {item.grid.map((day: any) => (
                    <Rect
                        key={day.date}
                        x={day.x}
                        y={day.y}
                        width={SQUARE_SIZE}
                        height={SQUARE_SIZE}
                        rx={6}
                        ry={6}
                        fill={getSquareColor(day.xp, day.date)}
                        stroke={selectedDate === day.date ? '#fff' : 'transparent'}
                        strokeWidth={2}
                        onPress={() => setSelectedDate(day.date)}
                    />
                ))}
            </Svg>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>STATIC MAP</Text>
                    <Text style={[styles.title, { opacity: 0.3, marginTop: 4, fontSize: 8 }]}>MONDAY START</Text>
                </View>
                <View style={styles.legend}>
                    <View style={[styles.legendBox, { backgroundColor: '#D3321D' }]} />
                    <Text style={styles.legendText}>MAX SIGNAL (1K)</Text>
                </View>
            </View>

            <View style={styles.pagerWrapper}>
                <FlatList
                    ref={scrollRef}
                    data={pagesData}
                    keyExtractor={item => item.id}
                    renderItem={renderPage}
                    horizontal
                    getItemLayout={(_, index) => ({
                        length: pageWidth,
                        offset: pageWidth * index,
                        index,
                    })}
                    initialScrollIndex={PAGES_IN_PAST}
                    snapToInterval={pageWidth}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                        const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
                        setActivePage(index);
                    }}
                    style={{ height: gridDim, width: pageWidth }}
                />

                <View style={styles.indicators}>
                    {pagesData.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                activePage === i ? { backgroundColor: '#fff', width: 12 } : { backgroundColor: 'rgba(255,255,255,0.1)' }
                            ]}
                        />
                    ))}
                </View>
            </View>

            {analysis && (
                <GlassCard style={styles.analysisCard}>
                    <View style={styles.analysisContent}>
                        <View style={styles.analysisHeader}>
                            <Text style={styles.analysisDate}>{analysis.formattedDate}</Text>
                            <Text style={[styles.analysisXP, { color: analysis.xp > 0 ? '#FFCF67' : 'rgba(255,255,255,0.4)' }]}>
                                {analysis.xp} XP
                            </Text>
                        </View>

                        <Text style={styles.analysisComment}>"{analysis.comment}"</Text>

                        {analysis.dayLogs.length > 0 && (
                            <View style={styles.logsList}>
                                {analysis.dayLogs.slice(0, 3).map((log, idx) => (
                                    <Text key={idx} style={styles.logItem} numberOfLines={1}>
                                        ◈ {log.type}: {log.score ? `${log.score}%` : 'LOGGED'}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                </GlassCard>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 2,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendBox: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1,
    },
    pagerWrapper: {
        marginBottom: 24,
        alignItems: 'center',
    },
    pageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    analysisCard: {
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
    },
    analysisContent: {
        padding: 24,
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        gap: 20,
    },
    analysisDate: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    analysisXP: {
        fontFamily: Fonts.monoBold,
        fontSize: 16,
    },
    analysisComment: {
        fontFamily: Fonts.body,
        fontSize: 15,
        color: '#E8E8E8',
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: 18,
    },
    logsList: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
        gap: 8,
    },
    logItem: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
    },
});

export default StaticMap;
