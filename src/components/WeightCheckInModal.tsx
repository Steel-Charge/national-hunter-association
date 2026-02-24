'use client';

import { useState, useMemo, useEffect } from 'react';
import { useHunterStore, WeightEntry } from '@/lib/store';
import { RANK_COLORS, RARITY_COLORS, Rank } from '@/lib/game-logic';
import { X, ChevronLeft, ChevronRight, Check, Minus } from 'lucide-react';
import { playSound } from '@/lib/audio';
import styles from './WeightCheckInModal.module.css';
import WeightProgressGraph from './WeightProgressGraph';

interface Props {
    onClose: () => void;
}

export default function WeightCheckInModal({ onClose }: Props) {
    const { profile, submitWeight, fetchWeightEntries, getTheme } = useHunterStore();
    const [view, setView] = useState<'CHECKIN' | 'PROGRESS'>('CHECKIN');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [graphPeriod, setGraphPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');

    const themeRank = getTheme();
    const rankColor = themeRank.length === 1
        ? `var(--rank-${themeRank.toLowerCase()})`
        : `var(--rarity-${themeRank.toLowerCase()})`;

    // Get the actual hex code for ChartJS
    const rankHex = themeRank.length === 1
        ? (RANK_COLORS[themeRank as Rank] || '#00e5ff')
        : (RARITY_COLORS[themeRank.toLowerCase()] || '#00e5ff');

    useEffect(() => {
        fetchWeightEntries();
    }, [fetchWeightEntries]);

    // Update weight input if selected date has an entry
    useEffect(() => {
        const entry = profile?.weightEntries?.find(e => e.date === selectedDate);
        if (entry) {
            setWeight(entry.weight.toString());
            setIsSubmitted(true);
        } else {
            setWeight('');
            setIsSubmitted(false);
        }
    }, [selectedDate, profile?.weightEntries]);

    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad start
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Fill days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            days.push({
                day: i,
                date: dateStr,
                entry: profile?.weightEntries?.find(e => e.date === dateStr)
            });
        }

        return days;
    }, [currentMonth, profile?.weightEntries]);

    const handleSubmit = async () => {
        if (!weight || isSubmitting) return;
        playSound('click');
        setIsSubmitting(true);
        try {
            await submitWeight(parseFloat(weight), selectedDate);
            setIsSubmitted(true);
            setTimeout(() => setIsSubmitted(false), 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const changeMonth = (offset: number) => {
        playSound('click');
        const newDate = new Date(currentMonth);
        newDate.setMonth(currentMonth.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    // Stats calculated from weightEntries
    const stats = useMemo(() => {
        const entries = profile?.weightEntries || [];
        if (entries.length < 1) return { current: 0, change: 0, trend: 'stable' };

        const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
        const current = sorted[0].weight;

        if (entries.length < 2) return { current, change: 0, trend: 'stable' };

        const previous = sorted[1].weight;
        const change = current - previous;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

        return { current, change: Math.abs(change), trend };
    }, [profile?.weightEntries]);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 style={{ color: rankHex }}>Weight Tracking</h2>
                    <button className={styles.closeButton} onClick={() => { playSound('click'); onClose(); }}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.tabControls}>
                    <button
                        className={`${styles.tabButton} ${view === 'CHECKIN' ? styles.tabButtonActive : ''}`}
                        onClick={() => { playSound('click'); setView('CHECKIN'); }}
                        style={view === 'CHECKIN' ? { color: rankHex, background: `${rankHex}15` } : {}}
                    >
                        Check-in
                    </button>
                    <button
                        className={`${styles.tabButton} ${view === 'PROGRESS' ? styles.tabButtonActive : ''}`}
                        onClick={() => { playSound('click'); setView('PROGRESS'); }}
                        style={view === 'PROGRESS' ? { color: rankHex, background: `${rankHex}15` } : {}}
                    >
                        Progress
                    </button>
                </div>

                <div className={styles.viewContainer}>
                    {view === 'CHECKIN' ? (
                        <div className={styles.checkInView}>
                            <div className={styles.calendarControls}>
                                <button className={styles.navButton} onClick={() => changeMonth(-1)} style={{ borderColor: `${rankHex}44` }}>
                                    <ChevronLeft size={20} />
                                </button>
                                <span className={styles.monthLabel}>
                                    {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </span>
                                <button className={styles.navButton} onClick={() => changeMonth(1)} style={{ borderColor: `${rankHex}44` }}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className={styles.calendarGrid}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className={styles.weekdayHeader}>{d}</div>
                                ))}
                                {calendarData.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.dayCell} ${!day ? styles.emptyDay : ''} ${day?.date === selectedDate ? styles.dayCellSelected : ''}`}
                                        style={day?.date === selectedDate ? { borderColor: rankHex, background: `${rankHex}15` } : {}}
                                        onClick={() => day && (playSound('click'), setSelectedDate(day.date))}
                                    >
                                        {day && (
                                            <>
                                                <span className={styles.dayNumber} style={day?.date === selectedDate ? { color: rankHex } : {}}>{day.day}</span>
                                                <div className={styles.dayIndicator}>
                                                    {day.entry ? (
                                                        <Check size={12} className={styles.indicatorActive} style={{ color: rankHex }} />
                                                    ) : (
                                                        day.date < new Date().toISOString().split('T')[0] && (
                                                            <Minus size={12} className={styles.indicatorMissed} />
                                                        )
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.inputSection}>
                                <div className={styles.dateDisplay}>
                                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className={styles.weightInputWrapper}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        className={styles.weightInput}
                                        style={{ borderColor: `${rankHex}44`, color: rankHex }}
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                    <span className={styles.weightUnit} style={{ color: `${rankHex}88` }}>KG</span>
                                </div>
                                <button
                                    className={`${styles.submitButton} ${isSubmitted ? styles.submittedButton : ''}`}
                                    style={!isSubmitted && weight ? { backgroundColor: rankHex, boxShadow: `0 0 20px ${rankHex}44` } : {}}
                                    onClick={handleSubmit}
                                    disabled={!weight || isSubmitting}
                                >
                                    {isSubmitting ? 'SUBMITTING...' : isSubmitted ? 'SUBMITTED' : 'SUBMIT CHECK-IN'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.progressView}>
                            <div className={styles.chartControls}>
                                <button
                                    style={graphPeriod === 'WEEK' ? { color: rankHex, background: `${rankHex}15`, borderColor: `${rankHex}44` } : {}}
                                    onClick={() => { playSound('click'); setGraphPeriod('WEEK'); }}
                                >
                                    Last 7 Days
                                </button>
                                <button
                                    className={`${styles.tabButton} ${graphPeriod === 'MONTH' ? styles.tabButtonActive : ''}`}
                                    style={graphPeriod === 'MONTH' ? { color: rankHex, background: `${rankHex}15`, borderColor: `${rankHex}44` } : {}}
                                    onClick={() => { playSound('click'); setGraphPeriod('MONTH'); }}
                                >
                                    Last 30 Days
                                </button>
                            </div>

                            <div className={styles.chartContainer}>
                                <WeightProgressGraph entries={profile?.weightEntries || []} viewMode={graphPeriod} themeColor={rankHex} />
                            </div>

                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Current</div>
                                    <div className={styles.statValue} style={{ color: rankHex }}>{stats.current} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>kg</span></div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Change</div>
                                    <div className={`${styles.statValue} ${stats.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                                        {stats.trend === 'up' ? '+' : stats.trend === 'down' ? '-' : ''}
                                        {stats.change.toFixed(1)} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>kg</span>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Entries</div>
                                    <div className={styles.statValue} style={{ color: rankHex }}>{profile?.weightEntries?.length || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
