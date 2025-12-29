'use client';

import React from 'react';

interface ProfileFrameProps {
    children?: React.ReactNode;
    frameId: string;
    className?: string;
}

export default function ProfileFrame({ children, frameId, className = '' }: ProfileFrameProps) {
    const idLower = frameId.toLowerCase().replace(/ /g, '-');
    const isMythic = idLower === 'mythic' || idLower === 'sovreign-of-the-gale' || idLower === 'the-unfallen-king' || idLower === 'echo-of-a-thousand-plans' || idLower === 'phoenix-soul' || idLower === 'beastmaster' || idLower === 'crimson-seeker' || idLower === 'fist-of-ruin' || idLower === 'warden-of-the-abyss' || idLower === 'thunderborn-tyrant' || idLower === 'soulbreaker-sage' || idLower === 'ghost-of-the-edge';

    return (
        <div className={`profile-frame-container ${idLower} ${isMythic ? 'prismatic-mythic' : ''} ${className}`}>
            <div className="profile-frame-inner">
                {children}
            </div>

            {/* Decorative Corner Accents */}
            <div className="frame-corner top-left"><div className="corner-accent"></div></div>
            <div className="frame-corner top-right"><div className="corner-accent"></div></div>
            <div className="frame-corner bottom-left"><div className="corner-accent"></div></div>
            <div className="frame-corner bottom-right"><div className="corner-accent"></div></div>

            {/* Side Accents for more decoration */}
            <div className="side-accent top"></div>
            <div className="side-accent bottom"></div>
            <div className="side-accent left"></div>
            <div className="side-accent right"></div>

            <style jsx>{`
                .profile-frame-container {
                    position: absolute;
                    inset: 10px;
                    border-radius: 4px;
                    pointer-events: none;
                    z-index: 50;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .profile-frame-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .frame-corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    z-index: 55;
                }

                .corner-accent {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: #fff;
                    filter: blur(2px);
                    opacity: 0.8;
                    box-shadow: 0 0 10px #fff;
                }

                .side-accent {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.1);
                    opacity: 0.5;
                }

                /* PRISMATIC MYTHIC STYLE - Holographic Effect */
                .prismatic-mythic {
                    border-width: 3px;
                    border-style: solid;
                    animation: prismatic-border 4s linear infinite;
                    box-shadow: 
                        inset 0 0 20px rgba(255, 255, 255, 0.3),
                        0 0 15px rgba(255, 255, 255, 0.2);
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.05) 0%,
                        rgba(255, 255, 255, 0.1) 25%,
                        rgba(255, 0, 0, 0.05) 40%,
                        rgba(0, 255, 0, 0.05) 50%,
                        rgba(0, 0, 255, 0.05) 60%,
                        rgba(255, 255, 255, 0.1) 75%,
                        rgba(255, 255, 255, 0.05) 100%
                    );
                    background-size: 200% 200%;
                    animation: prismatic-border 4s linear infinite, holographic 8s ease infinite;
                }

                .prismatic-mythic .corner-accent {
                    background: #fff;
                    animation: holographic 2s linear infinite;
                    box-shadow: 0 0 15px #fff, 0 0 30px #fff;
                }

                /* Standard Rarity Styles */
                .common { border-color: var(--rarity-common); }
                .rare { border-color: var(--rarity-rare); border-width: 2px; }
                .epic { border-color: var(--rarity-epic); border-width: 2px; border-style: double; }
                .legendary { 
                    border-color: var(--rarity-legendary); 
                    border-width: 3px; 
                    box-shadow: inset 0 0 15px rgba(255, 215, 0, 0.3);
                }

                /* Rank-based Styles */
                .e { border-color: #555; }
                .d { border: 2px solid var(--rank-d); }
                .c { border: 2px solid var(--rank-c); box-shadow: inset 0 0 10px rgba(0, 150, 255, 0.2); }
                .b { border: 3px solid var(--rank-b); box-shadow: inset 0 0 15px rgba(130, 71, 255, 0.3); }
                .a { border: 3px solid var(--rank-a); border-style: double; box-shadow: inset 0 0 20px rgba(255, 229, 151, 0.4); }
                .s { border: 4px solid var(--rank-s); box-shadow: inset 0 0 25px rgba(255, 42, 87, 0.5); animation: pulseS 2s infinite; }

                /* ANIMATIONS */
                @keyframes pulseS {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; box-shadow: inset 0 0 40px rgba(255, 42, 87, 0.7); }
                    100% { opacity: 0.8; }
                }

                /* Corner Alignment */
                .top-left { top: -4px; left: -4px; border-top: 3px solid inherit; border-left: 3px solid inherit; }
                .top-left .corner-accent { top: 0; left: 0; border-top-left-radius: 4px; }
                
                .top-right { top: -4px; right: -4px; border-top: 3px solid inherit; border-right: 3px solid inherit; }
                .top-right .corner-accent { top: 0; right: 0; border-top-right-radius: 4px; }
                
                .bottom-left { bottom: -4px; left: -4px; border-bottom: 3px solid inherit; border-left: 3px solid inherit; }
                .bottom-left .corner-accent { bottom: 0; left: 0; border-bottom-left-radius: 4px; }
                
                .bottom-right { bottom: -4px; right: -4px; border-bottom: 3px solid inherit; border-right: 3px solid inherit; }
                .bottom-right .corner-accent { bottom: 0; right: 0; border-bottom-right-radius: 4px; }

                /* Title-specific additions (keep existing logic) */
                .sovreign-of-the-gale { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; animation: windMorph 8s infinite ease-in-out; }
                .the-unfallen-king { border-image: linear-gradient(to bottom, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c) 1; }
                
                @keyframes windMorph {
                    0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
                    50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
                }

                /* Shimmer overlay for all prismatic frames */
                .prismatic-mythic:before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        105deg,
                        transparent 40%,
                        rgba(255, 255, 255, 0.4) 45%,
                        rgba(255, 255, 255, 0.6) 50%,
                        rgba(255, 255, 255, 0.4) 55%,
                        transparent 60%
                    );
                    background-size: 200% 200%;
                    animation: shimmer 4s infinite linear;
                    z-index: 52;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
