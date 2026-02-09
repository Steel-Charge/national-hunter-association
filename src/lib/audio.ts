/**
 * Shared utility for playing sound effects in the Global Hunters Association app.
 */
export const playSound = (type: 'text' | 'click' | 'popup') => {
    // Basic throttling or check if window exists for SSR safety
    if (typeof window === 'undefined') return;

    try {
        const audioPath = type === 'text' ? '/text-sound.mp3' : '/click.mp3';
        const audio = new Audio(audioPath);
        audio.volume = type === 'click' ? 0.3 : 0.5; // Adjusted volumes

        // Use a promise to handle browsers that block autoplay
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Silently fail if autoplay is blocked
                console.log(`Audio play prevented: ${error}`);
            });
        }
    } catch (e) {
        console.error('Audio playback error:', e);
    }
};
