import React from 'react';

interface ProfileFrameProps {
    children?: React.ReactNode;
    frameId: string;
    className?: string;
}

export default function ProfileFrame({ children, frameId, className = '' }: ProfileFrameProps) {
    const idLower = frameId.toLowerCase();

    return (
        <div className={`profile-frame-container ${idLower} ${className}`}>
            <div className="profile-frame-inner">
                {children}
            </div>

            {/* Decorative Corner Accents (more complex for ranked/rarity) */}
            <div className="frame-corner top-left">
                <div className="corner-dot"></div>
            </div>
            <div className="frame-corner top-right">
                <div className="corner-dot"></div>
            </div>
            <div className="frame-corner bottom-left">
                <div className="corner-dot"></div>
            </div>
            <div className="frame-corner bottom-right">
                <div className="corner-dot"></div>
            </div>

            <style jsx>{`
                .profile-frame-container {
                    position: absolute;
                    inset: 10px;
                    border-radius: 4px;
                    pointer-events: none;
                    z-index: 50;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .profile-frame-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .frame-corner {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    z-index: 51;
                }

                .corner-dot {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #fff;
                }

                /* Rarity Styles */
                .common { border-color: var(--rarity-common); box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.2); }
                .common .frame-corner { border: 3px solid var(--rarity-common); }
                
                .rare { border-color: var(--rarity-rare); box-shadow: inset 0 0 25px rgba(205, 127, 50, 0.3); }
                .rare .frame-corner { border: 3px solid var(--rarity-rare); }

                .epic { 
                    border-color: var(--rarity-epic); 
                    box-shadow: inset 0 0 30px rgba(192, 192, 192, 0.4);
                    border-style: double;
                    border-width: 4px;
                }
                .epic .frame-corner { border: 4px solid var(--rarity-epic); }

                .legendary { 
                    border-color: var(--rarity-legendary); 
                    box-shadow: inset 0 0 40px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2);
                    border-width: 3px;
                }
                .legendary .frame-corner { border: 4px solid var(--rarity-legendary); }

                .mythic { 
                    border-color: var(--rarity-mythic); 
                    box-shadow: inset 0 0 50px rgba(255, 42, 87, 0.4), 0 0 30px rgba(255, 42, 87, 0.3);
                    border-width: 3px;
                    animation: pulseMythic 3s infinite;
                }
                .mythic .frame-corner { border: 5px solid var(--rarity-mythic); }

                .event { 
                    border-color: var(--rarity-event); 
                    box-shadow: inset 0 0 40px rgba(255, 28, 210, 0.3);
                    border-style: dashed;
                }
                .event .frame-corner { border: 4px solid var(--rarity-event); }

                /* Rank Styles */
                .e { border-color: #888; box-shadow: inset 0 0 15px rgba(136, 136, 136, 0.2); }
                .e .frame-corner { border: 2px solid #888; }

                .d { border-color: var(--rank-d); box-shadow: inset 0 0 20px rgba(100, 255, 100, 0.2); }
                .d .frame-corner { border: 3px solid var(--rank-d); }

                .c { border-color: var(--rank-c); box-shadow: inset 0 0 25px rgba(0, 150, 255, 0.3); }
                .c .frame-corner { border: 3px solid var(--rank-c); }

                .b { border-color: var(--rank-b); box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.3); }
                .b .frame-corner { border: 3px solid var(--rank-b); }

                .a { border-color: var(--rank-a); box-shadow: inset 0 0 40px rgba(255, 120, 0, 0.4); }
                .a .frame-corner { border: 4px solid var(--rank-a); }

                .s { 
                    border-color: var(--rank-s); 
                    box-shadow: inset 0 0 50px rgba(255, 0, 255, 0.4), 0 0 20px rgba(255, 0, 255, 0.2);
                    animation: pulseS 2s infinite;
                }
                .s .frame-corner { border: 5px solid var(--rank-s); }

                @keyframes pulseMythic {
                    0% { opacity: 0.8; box-shadow: inset 0 0 50px rgba(255, 42, 87, 0.4); }
                    50% { opacity: 1; box-shadow: inset 0 0 70px rgba(255, 42, 87, 0.6); }
                    100% { opacity: 0.8; box-shadow: inset 0 0 50px rgba(255, 42, 87, 0.4); }
                }

                @keyframes pulseS {
                    0% { border-color: var(--rank-s); }
                    50% { border-color: #fff; box-shadow: inset 0 0 60px rgba(255, 0, 255, 0.6); }
                    100% { border-color: var(--rank-s); }
                }

                /* Corner Alignment */
                .top-left { top: -2px; left: -2px; border-right: none !important; border-bottom: none !important; }
                .top-left .corner-dot { top: -2px; left: -2px; }

                .top-right { top: -2px; right: -2px; border-left: none !important; border-bottom: none !important; }
                .top-right .corner-dot { top: -2px; right: -2px; }

                .bottom-left { bottom: -2px; left: -2px; border-right: none !important; border-top: none !important; }
                .bottom-left .corner-dot { bottom: -2px; left: -2px; }

                .bottom-right { bottom: -2px; right: -2px; border-left: none !important; border-top: none !important; }
                .bottom-right .corner-dot { bottom: -2px; right: -2px; }
            `}</style>
        </div>
    );
}
