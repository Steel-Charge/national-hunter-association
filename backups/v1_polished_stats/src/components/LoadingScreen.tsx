'use client';

import { useEffect, useState } from 'react';
import { Rank } from '@/lib/game-logic';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
    loading: boolean;
    rank?: Rank | string;
}

export default function LoadingScreen({ loading, rank = 'E' }: LoadingScreenProps) {
    const [shouldRender, setShouldRender] = useState(loading);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (loading) {
            setShouldRender(true);
            setIsFading(false);
        } else {
            setIsFading(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsFading(false);
            }, 500); // Match CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (!shouldRender) return null;

    const rankColor = `var(--rank-${rank.toLowerCase()})`;

    return (
        <div
            className={`${styles.overlay} ${isFading ? styles.hidden : styles.visible}`}
            style={{ '--rank-color': rankColor } as React.CSSProperties}
        >
            <div className={styles.throbberContainer}>
                <div className={styles.throbber} />
            </div>
            <div className={styles.loadingText}>Loading...</div>
        </div>
    );
}
