'use client';

import { useEffect, useState } from 'react';
import { useHunterStore, Title } from '@/lib/store';
import TitleCongratulationModal from './TitleCongratulationModal';

export default function NewTitleHandler() {
    const { profile, loading } = useHunterStore();
    const [queue, setQueue] = useState<Title[]>([]);
    const [currentTitle, setCurrentTitle] = useState<Title | null>(null);

    useEffect(() => {
        if (loading || !profile || !profile.unlockedTitles) return;

        const checkNewTitles = () => {
            const knownTitlesJson = localStorage.getItem('nha_known_titles');
            let knownTitles: string[] = knownTitlesJson ? JSON.parse(knownTitlesJson) : [];

            // If first time (no known titles), assume all current titles are known to prevent spamming generic ones
            // UNLESS it's a fresh account (e.g. only Hunter title).
            // Actually, better strategy: If 'nha_known_titles' doesn't exist, set it to current titles and don't show anything.
            // This prevents spamming on first load of this feature for existing users.
            if (!knownTitlesJson) {
                const currentNames = profile.unlockedTitles.map(t => t.name);
                localStorage.setItem('nha_known_titles', JSON.stringify(currentNames));
                return;
            }

            const newTitles = profile.unlockedTitles.filter(t => !knownTitles.includes(t.name));

            if (newTitles.length > 0) {
                // Add to queue
                setQueue(prev => {
                    // Filter duplicates that might already be in queue
                    const uniqueNew = newTitles.filter(nt => !prev.some(p => p.name === nt.name));
                    return [...prev, ...uniqueNew];
                });

                // Update local storage so we don't detect them again
                // We add them to known list immediately.
                const updatedKnown = [...knownTitles, ...newTitles.map(t => t.name)];
                localStorage.setItem('nha_known_titles', JSON.stringify(updatedKnown));
            }
        };

        checkNewTitles();
    }, [profile, loading]); // Dependencies: check whenever profile updates

    useEffect(() => {
        // Process queue
        if (!currentTitle && queue.length > 0) {
            const next = queue[0];
            setCurrentTitle(next);
            setQueue(prev => prev.slice(1));
        }
    }, [queue, currentTitle]);

    const handleClose = () => {
        setCurrentTitle(null);
    };

    if (!currentTitle) return null;

    return (
        <TitleCongratulationModal title={currentTitle} onClose={handleClose} />
    );
}
