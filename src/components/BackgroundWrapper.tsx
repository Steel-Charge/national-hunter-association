'use client';

import { useHunterStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BackgroundWrapper({ children }: { children: React.ReactNode }) {
    const { profile } = useHunterStore();
    const pathname = usePathname();

    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Reset error state when profile changes
        setHasError(false);

        const avatarUrl = profile?.avatarUrl;
        // Fix common malformed data URIs (e.g. colon instead of semicolon)
        // Also handle potential spaces/newlines in base64
        let fixedUrl = avatarUrl?.replace('data:image/jpeg:base64', 'data:image/jpeg;base64')
            .replace('data:image/png:base64', 'data:image/png;base64');

        if (fixedUrl) {
            // Basic cleanup of whitespace which might break data URIs
            fixedUrl = fixedUrl.trim();
        }

        const isValid = fixedUrl &&
            fixedUrl !== 'null' &&
            fixedUrl !== 'undefined' &&
            fixedUrl !== '' &&
            (fixedUrl.startsWith('/') || fixedUrl.startsWith('http') || fixedUrl.startsWith('data:image'));

        if (isValid && fixedUrl) {
            setImgSrc(fixedUrl);
        } else if (profile && !profile.avatarUrl) {
            // Only fall back to placeholder if profile is loaded but has no avatar
            setImgSrc('/placeholder.png');
        }
    }, [profile]);

    const handleError = () => {
        console.error('Background image failed to load, falling back to placeholder.');
        setHasError(true);
        setImgSrc('/placeholder.png');
    };

    // On profile page (home), show full opacity. On others, fade it.
    const isProfilePage = pathname === '/home' || pathname === '/';
    const overlayOpacity = isProfilePage ? 0.0 : 0.90;

    return (
        <>
            {imgSrc && (
                <img
                    src={imgSrc}
                    alt="Background"
                    onError={handleError}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: -2,
                    }}
                />
            )}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    opacity: overlayOpacity,
                    zIndex: -1,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: 'none'
                }}
            />
            {/* Bottom Gradient for Profile Page */}
            {isProfilePage && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '40%',
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)',
                        zIndex: -1,
                        pointerEvents: 'none'
                    }}
                />
            )}
            {children}
        </>
    );
}
