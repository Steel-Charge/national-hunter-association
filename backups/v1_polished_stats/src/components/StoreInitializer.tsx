'use client';

import { useEffect, useRef } from 'react';
import { useHunterStore } from '@/lib/store';

export default function StoreInitializer() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            useHunterStore.getState().initialize();
            initialized.current = true;
        }
    }, []);

    return null;
}
