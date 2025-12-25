'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Activity, Target, Users, Trophy, Settings } from 'lucide-react';
import { useHunterStore } from '@/lib/store';
import styles from './Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();
    const { getTheme, profile } = useHunterStore();
    const rank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${rank.toLowerCase()})`;

    const isActive = (path: string) => pathname === path;

    // Check if we are in "view mode" (viewing another hunter)
    // Path format: /batch3/[username] or /batch3/[username]/stats
    const pathParts = pathname.split('/');
    const isViewMode = pathParts[1] === 'batch3' && pathParts.length >= 3;
    const viewedUsername = isViewMode ? pathParts[2] : null;

    const profileLink = isViewMode ? `/batch3/${viewedUsername}` : '/home';
    const statsLink = isViewMode ? `/batch3/${viewedUsername}/stats` : '/stats';
    const missionsLink = isViewMode ? `/batch3/${viewedUsername}/missions` : '/missions';

    return (
        <nav
            className={styles.navbar}
            style={{ borderColor: rankColor, boxShadow: `0 0 20px ${rankColor}33` } as React.CSSProperties}
        >
            <Link
                href={profileLink}
                className={`${styles.navItem} ${isActive(profileLink) ? styles.active : ''}`}
                style={isActive(profileLink) ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <User size={24} style={isActive(profileLink) ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Profile</span>
            </Link>
            <Link
                href={statsLink}
                className={`${styles.navItem} ${isActive(statsLink) ? styles.active : ''}`}
                style={isActive(statsLink) ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <Activity size={24} style={isActive(statsLink) ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Stats</span>
            </Link>
            <Link
                href={missionsLink}
                className={`${styles.navItem} ${isActive(missionsLink) ? styles.active : ''}`}
                style={isActive(missionsLink) ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <Target size={24} style={isActive(missionsLink) ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Missions</span>
            </Link>
            <Link
                href="/batch3"
                className={`${styles.navItem} ${isActive('/batch3') || pathname.startsWith('/batch3') ? styles.active : ''}`}
                style={isActive('/batch3') || pathname.startsWith('/batch3') ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <Users size={24} style={isActive('/batch3') || pathname.startsWith('/batch3') ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Hub</span>
            </Link>
            <Link
                href="/rankings"
                className={`${styles.navItem} ${isActive('/rankings') ? styles.active : ''}`}
                style={isActive('/rankings') ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <Trophy size={24} style={isActive('/rankings') ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Rankings</span>
            </Link>
            <Link
                href="/settings"
                className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
                style={isActive('/settings') ? { color: rankColor, textShadow: `0 0 5px ${rankColor}` } : {}}
            >
                <Settings size={24} style={isActive('/settings') ? { filter: `drop-shadow(0 0 5px ${rankColor})` } : {}} />
                <span>Settings</span>
            </Link>
        </nav>
    );
}
