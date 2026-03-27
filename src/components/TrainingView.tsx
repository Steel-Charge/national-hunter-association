"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Clock, Hash, ChevronDown, ChevronUp, ArrowRight, Settings } from 'lucide-react';
import styles from './TrainingView.module.css';
import { v4 as uuidv4 } from 'uuid';
import { useHunterStore, getDisplayTitle } from '@/lib/store';

// ─── Types ──────────────────────────────────────────────────────────────────

type MeasureType = 'time' | 'units';

interface Exercise {
    id: string;
    description: string;
    type: MeasureType | null; 
    sets: string; 
    reps: string; 
}

interface DayPlan {
    isRest: boolean;
    exercises: Exercise[];
}

type WorkoutPlan = Record<string, DayPlan>;

interface SessionLog {
    date: string;
    value: string; 
}
type WorkoutLogs = Record<string, Record<string, SessionLog[]>>;

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_FULL: Record<string, string> = {
    MON: 'MONDAY',
    TUE: 'TUESDAY',
    WED: 'WEDNESDAY',
    THU: 'THURSDAY',
    FRI: 'FRIDAY',
    SAT: 'SATURDAY',
    SUN: 'SUNDAY',
};

const makeDefaultPlan = (): WorkoutPlan =>
    Object.fromEntries(
        DAYS.map((d) => [
            d,
            {
                isRest: d === 'SUN',
                exercises: [
                    {
                        id: uuidv4(),
                        description: '',
                        type: 'units', 
                        sets: '',
                        reps: '',
                    },
                ],
            },
        ])
    );

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function getLastSession(
    logs: WorkoutLogs,
    day: string,
    exerciseId: string
): string | null {
    const sessions = logs?.[day]?.[exerciseId];
    if (!sessions || sessions.length === 0) return null;
    const today = todayKey();
    const prev = [...sessions].reverse().find((s) => s.date !== today);
    return prev ? prev.value : null;
}

function getTodaySession(
    logs: WorkoutLogs,
    day: string,
    exerciseId: string
): string | null {
    const sessions = logs?.[day]?.[exerciseId];
    if (!sessions) return null;
    const today = todayKey();
    const entry = sessions.find((s) => s.date === today);
    return entry ? entry.value : null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TrainingViewProps {
    profileName: string;
    rankColor: string;
}

export default function TrainingView({ profileName, rankColor }: TrainingViewProps) {
    const { profile, getOverallRank, getTheme } = useHunterStore();
    const [plan, setPlan] = useState<WorkoutPlan>(makeDefaultPlan());
    const [logs, setLogs] = useState<WorkoutLogs>({});
    const [selectedDay, setSelectedDay] = useState<string>('MON');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentInputs, setCurrentInputs] = useState<Record<string, string>>({});

    const overallRank = getOverallRank();
    const themeRank = getTheme();
    const displayTitle = profile ? getDisplayTitle(profile?.activeTitle?.name || 'Hunter', profile?.role || 'Hunter', profile?.agencyName) : 'Hunter';

    // ── LocalStorage keys
    const planKey = `${profileName}_workout_plan_v2`; 
    const logsKey = `${profileName}_workout_logs_v2`;

    // ── Load from localStorage on mount
    useEffect(() => {
        try {
            const storedPlan = localStorage.getItem(planKey);
            if (storedPlan) {
                const parsed = JSON.parse(storedPlan) as WorkoutPlan;
                const merged = { ...makeDefaultPlan(), ...parsed };
                setPlan(merged);
            }
        } catch { /* ignore */ }

        try {
            const storedLogs = localStorage.getItem(logsKey);
            if (storedLogs) setLogs(JSON.parse(storedLogs));
        } catch { /* ignore */ }
    }, [planKey, logsKey]);

    // ── Persist plan to localStorage
    const savePlan = useCallback((newPlan: WorkoutPlan) => {
        setPlan(newPlan);
        try { localStorage.setItem(planKey, JSON.stringify(newPlan)); } catch { /* ignore */ }
    }, [planKey]);

    // ── Persist logs to localStorage
    const saveLogs = useCallback((newLogs: WorkoutLogs) => {
        setLogs(newLogs);
        try { localStorage.setItem(logsKey, JSON.stringify(newLogs)); } catch { /* ignore */ }
    }, [logsKey]);

    // ── Current day data
    const dayPlan = plan[selectedDay] ?? { isRest: false, exercises: [] };

    // ── Toggle rest
    const toggleRest = () => {
        const newPlan = {
            ...plan,
            [selectedDay]: { ...dayPlan, isRest: !dayPlan.isRest },
        };
        savePlan(newPlan);
        setExpandedId(null);
    };

    // ── Update exercise field
    const updateExercise = (id: string, patch: Partial<Exercise>) => {
        const newExercises = dayPlan.exercises.map((e) =>
            e.id === id ? { ...e, ...patch } : e
        );
        savePlan({ ...plan, [selectedDay]: { ...dayPlan, exercises: newExercises } });
    };

    // ── Add exercise
    const addExercise = () => {
        const newEx: Exercise = {
            id: uuidv4(),
            description: '',
            type: 'units',
            sets: '',
            reps: '',
        };
        savePlan({
            ...plan,
            [selectedDay]: {
                ...dayPlan,
                exercises: [...dayPlan.exercises, newEx],
            },
        });
    };

    // ── Remove exercise
    const removeExercise = (id: string) => {
        if (dayPlan.exercises.length <= 1) return;
        const newExercises = dayPlan.exercises.filter((e) => e.id !== id);
        savePlan({ ...plan, [selectedDay]: { ...dayPlan, exercises: newExercises } });
        if (expandedId === id) setExpandedId(null);
    };

    // ── Log a current session value
    const logValue = (exerciseId: string, value: string) => {
        if (!value.trim()) return;
        const today = todayKey();
        const dayLogs = logs[selectedDay] ?? {};
        const sessions = dayLogs[exerciseId] ?? [];
        const filtered = sessions.filter((s) => s.date !== today);
        const newSessions: SessionLog[] = [...filtered, { date: today, value }];
        const newLogs: WorkoutLogs = {
            ...logs,
            [selectedDay]: { ...dayLogs, [exerciseId]: newSessions },
        };
        saveLogs(newLogs);
    };

    return (
        <div className={styles.wrapper}>
            {/* ─── Header ────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerMain}>
                    <h1 className={styles.profileName} style={{ color: rankColor, textShadow: `0 0 15px ${rankColor}` }}>
                        {profile?.name.toUpperCase()}
                    </h1>
                    <div className={styles.profileTitle} style={{ color: rankColor }}>
                        {displayTitle.toUpperCase()}
                    </div>
                </div>
                <button className={styles.settingsIcon} style={{ color: rankColor }}>
                    <Settings size={28} />
                </button>
            </div>

            {/* ─── SCHEDULE section ────────────────────────────────────────── */}
            <div className={styles.scheduleSection}>
                <h2 className={styles.scheduleTitle} style={{ color: rankColor }}>
                    SCHEDULE
                </h2>
                <div className={styles.scheduleBox} style={{ borderColor: rankColor }}>
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            className={`${styles.dayPill} ${selectedDay === day ? styles.dayPillActive : ''}`}
                            style={selectedDay === day ? { backgroundColor: rankColor, color: '#000' } : { borderColor: rankColor, color: rankColor }}
                            onClick={() => { setSelectedDay(day); setExpandedId(null); }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Day + Rest Row ──────────────────────────────────────────── */}
            <div className={styles.dayHeaderRow}>
                <h3 className={styles.dayTitle} style={{ color: rankColor }}>
                    {DAY_FULL[selectedDay]}
                </h3>
                <button
                    className={`${styles.restBtn} ${dayPlan.isRest ? styles.restBtnActive : ''}`}
                    style={dayPlan.isRest 
                        ? { backgroundColor: rankColor, color: '#000', borderColor: rankColor, boxShadow: `0 0 10px ${rankColor}` }
                        : { borderColor: rankColor, color: rankColor }
                    }
                    onClick={toggleRest}
                >
                    REST
                </button>
            </div>

            {/* ─── Exercise List ───────────────────────────────────────────── */}
            {!dayPlan.isRest && (
                <div className={styles.exerciseList}>
                    {/* Column labels */}
                    <div className={styles.labelsRow}>
                        <div /> {/* Spacer for desc */}
                        <div className={styles.labelCell}>SETS</div>
                        <div /> {/* Spacer for 'x' */}
                        <div className={styles.labelCell}>REPS</div>
                    </div>

                    {dayPlan.exercises.map((ex) => {
                        const isExpanded = expandedId === ex.id;
                        const lastVal = getLastSession(logs, selectedDay, ex.id);
                        const todayVal = getTodaySession(logs, selectedDay, ex.id);
                        const inputKey = `${selectedDay}_${ex.id}`;
                        const currentInput = currentInputs[inputKey] ?? (todayVal !== null ? String(todayVal) : '');
                        const canDelete = dayPlan.exercises.length > 1;

                        return (
                            <div key={ex.id} className={styles.exerciseBlock}>
                                <div className={styles.exerciseRow}>
                                    {/* Description Block */}
                                    <div 
                                        className={`${styles.descBlock} ${isExpanded ? styles.descBlockActive : ''}`}
                                        style={isExpanded ? { backgroundColor: rankColor, border: `2px solid ${rankColor}` } : { border: `2px solid ${rankColor}` }}
                                        onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                                    >
                                        <input
                                            className={styles.descInput}
                                            value={ex.description}
                                            onChange={(e) => updateExercise(ex.id, { description: e.target.value })}
                                            placeholder="EXERCISE NAME"
                                            onClick={(e) => e.stopPropagation()}
                                            style={isExpanded ? { color: '#000' } : { color: '#fff' }}
                                        />
                                        {/* Measurement Type Toggle */}
                                        <button 
                                            className={styles.typeToggle}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateExercise(ex.id, { type: ex.type === 'units' ? 'time' : 'units' });
                                            }}
                                            style={isExpanded ? { color: '#000' } : { color: rankColor }}
                                        >
                                            {ex.type === 'time' ? <Clock size={14} /> : <Hash size={14} />}
                                        </button>
                                    </div>

                                    {/* Sets Block */}
                                    <div className={styles.boxBlock} style={{ borderColor: rankColor }}>
                                        <input
                                            className={styles.boxInput}
                                            value={ex.sets}
                                            onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                                            placeholder="*"
                                        />
                                    </div>

                                    <div className={styles.xSep} style={{ color: rankColor }}>X</div>

                                    {/* Reps Block */}
                                    <div className={styles.boxBlock} style={{ borderColor: rankColor }}>
                                        <input
                                            className={styles.boxInput}
                                            value={ex.reps}
                                            onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                                            placeholder={ex.type === 'time' ? 's' : '*'}
                                        />
                                    </div>
                                    
                                    {/* Delete icon */}
                                    {canDelete && (
                                        <button className={styles.miniDelete} onClick={() => removeExercise(ex.id)}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Comparison Block (Shown when expanded) */}
                                {isExpanded && (
                                    <div className={styles.comparisonBox} style={{ borderColor: rankColor }}>
                                        <div className={styles.comparisonTitle} style={{ color: rankColor }}>
                                            {ex.description.toUpperCase() || 'EXERCISE'}
                                        </div>
                                        <div className={styles.comparisonGrid}>
                                            <div className={styles.compCell}>
                                                <div className={styles.compValBox} style={{ borderColor: rankColor }}>
                                                    {lastVal || '—'}
                                                </div>
                                                <div className={styles.compLabel}>LAST SESSION</div>
                                            </div>
                                            <div className={styles.compArrow} style={{ color: rankColor }}>
                                                <ArrowRight size={32} />
                                            </div>
                                            <div className={styles.compCell}>
                                                <div className={styles.compInputBox} style={{ borderColor: rankColor }}>
                                                    <input
                                                        className={styles.compInput}
                                                        value={currentInput}
                                                        onChange={(e) => setCurrentInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                                        onBlur={(e) => logValue(ex.id, e.target.value)}
                                                        placeholder=""
                                                    />
                                                </div>
                                                <div className={styles.compLabel}>CURRENT</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Item Block */}
                    <div className={styles.addRow}>
                        <button className={styles.addItemBtn} onClick={addExercise} style={{ borderColor: rankColor }}>
                            <div className={styles.addItemLabel}>ADD ITEM...</div>
                        </button>
                        <div className={styles.boxBlock} style={{ borderColor: rankColor, opacity: 0.5 }}>
                            <div className={styles.boxPlaceholder}>*</div>
                        </div>
                        <div className={styles.xSep} style={{ color: rankColor }}>X</div>
                        <div className={styles.boxBlock} style={{ borderColor: rankColor, opacity: 0.5 }}>
                            <div className={styles.boxPlaceholder}>*</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest Day view */}
            {dayPlan.isRest && (
                <div className={styles.restPlaceholder}>
                    <div className={styles.restIcon} style={{ color: rankColor }}>💤</div>
                    <p className={styles.restMsg} style={{ color: `${rankColor}99` }}>
                        REST DAY — NO ITEMS CAN BE ADDED
                    </p>
                </div>
            )}
        </div>
    );
}
