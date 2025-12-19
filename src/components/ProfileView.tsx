import styles from '@/app/home/page.module.css';
import { UserProfile } from '@/lib/store';

interface ProfileViewProps {
    profile: UserProfile;
    overallRank: string;
    themeRank: string;
    specialTheme?: 'rare' | 'epic' | 'legendary' | 'mythic' | null;
}

export default function ProfileView({ profile, overallRank, themeRank, specialTheme }: ProfileViewProps) {
    const colorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.content}>
            <div className={styles.profileSection}>
                <div className={styles.info}>
                    <h1 className={styles.name} style={{ color: colorVar, textShadow: `0 0 10px ${colorVar}` }}>
                        {profile.name}
                    </h1>
                    <p className={styles.title} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})` }}>
                        {profile.activeTitle?.name || 'Hunter'}
                    </p>

                    <div className={styles.badges}>
                        {profile.unlockedTitles.map((title, i) => (
                            <div
                                key={i}
                                className={styles.badge}
                                style={{
                                    borderColor: `var(--rarity-${title.rarity?.toLowerCase() || 'common'})`,
                                    color: `var(--rarity-${title.rarity?.toLowerCase() || 'common'})`,
                                    background: 'transparent'
                                }}
                            >
                                {title.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rankSection}>
                    <span className={styles.rankLabel} style={{ color: `var(--rank-${themeRank.toLowerCase()})` }}>RANK:</span>
                    <span className={`${styles.rankValue} rank-${themeRank} rank-text`}>
                        {overallRank}
                    </span>
                </div>
            </div>
        </div>
    );
}
