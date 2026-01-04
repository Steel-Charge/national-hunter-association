'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
    installPWA: () => Promise<void>;
    isInstallable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered: ', registration))
                .catch(err => console.log('SW registration failed: ', err));
        }

        const handler = (e: Event) => {
            console.log('PWA: beforeinstallprompt fired');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        console.log('PWA: Adding event listener for beforeinstallprompt');
        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            console.log('PWA: Removing event listener');
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return (
        <PWAContext.Provider value={{ installPWA, isInstallable }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
