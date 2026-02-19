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

            {idLower === 'e' && (
                <svg className="rank-frame-svg e-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="100" fill="none" vectorEffect="non-scaling-stroke" pathLength="100" />
                </svg>
            )}

            {idLower === 'd' && (
                <svg className="rank-frame-svg d-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <filter id="glow-d">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="none" vectorEffect="non-scaling-stroke" filter="url(#glow-d)" />
                </svg>
            )}

            {idLower === 'c' && (
                <svg className="rank-frame-svg c-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Corner energy bursts */}
                    <line x1="0" y1="0" x2="10" y2="10" className="burst b1" vectorEffect="non-scaling-stroke" />
                    <line x1="100" y1="0" x2="90" y2="10" className="burst b2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="100" x2="10" y2="90" className="burst b3" vectorEffect="non-scaling-stroke" />
                    <line x1="100" y1="100" x2="90" y2="90" className="burst b4" vectorEffect="non-scaling-stroke" />
                    <rect x="0" y="0" width="100" height="100" fill="none" vectorEffect="non-scaling-stroke" strokeDasharray="30 70" />
                </svg>
            )}

            {idLower === 'b' && (
                <svg className="rank-frame-svg b-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="grad-b" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--rank-b)" stopOpacity="0.8">
                                <animate attributeName="offset" values="-1; 1" dur="2s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="50%" stopColor="#fff" stopOpacity="1">
                                <animate attributeName="offset" values="0; 2" dur="2s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="var(--rank-b)" stopOpacity="0.8">
                                <animate attributeName="offset" values="1; 3" dur="2s" repeatCount="indefinite" />
                            </stop>
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="none" vectorEffect="non-scaling-stroke" stroke="url(#grad-b)" strokeWidth="4" />
                </svg>
            )}

            {idLower === 'a' && (
                <svg className="rank-frame-svg a-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--rank-a)" stopOpacity="1" />
                            <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                            <stop offset="100%" stopColor="var(--rank-a)" stopOpacity="1" />
                            <animateTransform attributeName="gradientTransform" type="translate" values="-1 0; 1 0" dur="1s" repeatCount="indefinite" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="none" vectorEffect="non-scaling-stroke" stroke="url(#grad-a)" strokeWidth="6" />
                </svg>
            )}

            {idLower === 's' && (
                <svg className="rank-frame-svg s-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <filter id="distortion-s">
                            <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turb">
                                <animate attributeName="baseFrequency" values="0.05; 0.07; 0.05" dur="1s" repeatCount="indefinite" />
                            </feTurbulence>
                            <feDisplacementMap in="SourceGraphic" in2="turb" scale="5" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </defs>
                    <rect x="5" y="5" width="90" height="90" fill="none" vectorEffect="non-scaling-stroke" stroke="var(--rank-s)" strokeWidth="6" filter="url(#distortion-s)" />
                </svg>
            )}

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

                /* PRISMATIC MYTHIC STYLE - Holographic White Effect */
                .prismatic-mythic {
                    border-width: 3px;
                    border-style: solid;
                    border-color: rgba(255, 255, 255, 0.8);
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.1) 0%,
                        rgba(200, 240, 255, 0.1) 30%,
                        rgba(255, 200, 240, 0.1) 60%,
                        rgba(255, 255, 255, 0.1) 100%
                    );
                    animation: shimmerFrame 6s infinite linear;
                }

                @keyframes shimmerFrame {
                    0% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.5); border-color: rgba(255, 255, 255, 0.8); }
                    50% { box-shadow: 0 0 25px rgba(255, 255, 255, 0.8), 0 0 5px rgba(200, 240, 255, 0.5); border-color: #fff; }
                    100% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.5); border-color: rgba(255, 255, 255, 0.8); }
                }

                .prismatic-mythic .corner-accent {
                    background: #fff;
                    box-shadow: 0 0 15px #fff;
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
                .e { border: none !important; }
                .e .frame-corner, .e .side-accent, .e .corner-accent { display: none !important; }
                .rank-frame-svg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                .e-frame rect {
                    stroke: #dfdfdf;
                    stroke-width: 4px;
                    stroke-dasharray: 4.16 4.16;
                    animation: eFrameAnim 4s infinite linear;
                }

                @keyframes eFrameAnim {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 100; }
                }

                /* D-Rank: Breathing Glow */
                .d { border: none !important; }
                .d .frame-corner, .d .side-accent, .d .corner-accent { display: none !important; }
                .d-frame rect {
                    stroke: var(--rank-d);
                    stroke-width: 8px;
                    opacity: 0.3;
                    animation: dFrameBreathe 3s infinite ease-in-out;
                }
                @keyframes dFrameBreathe {
                    0%, 100% { opacity: 0.3; stroke-width: 8px; }
                    50% { opacity: 0.8; stroke-width: 10px; }
                }

                /* C-Rank: Electric Flicker */
                .c { border: none !important; }
                .c .frame-corner, .c .side-accent, .c .corner-accent { display: none !important; }
                .c-frame rect {
                    stroke: var(--rank-c);
                    stroke-width: 2px;
                    opacity: 0.6;
                }
                .c-frame .burst {
                    stroke: #fff;
                    stroke-width: 3px;
                    filter: drop-shadow(0 0 5px var(--rank-c));
                    animation: cBurstFlicker 1.5s infinite;
                }
                .burst.b1 { animation-delay: 0.1s; }
                .burst.b2 { animation-delay: 0.4s; }
                .burst.b3 { animation-delay: 0.7s; }
                .burst.b4 { animation-delay: 1.1s; }

                @keyframes cBurstFlicker {
                    0%, 100% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2) translate(2px, 2px); }
                }

                /* B-Rank: Flowing Energy */
                .b { border: none !important; }
                .b .frame-corner, .b .side-accent, .b .corner-accent { display: none !important; }
                .b-frame rect {
                    filter: drop-shadow(0 0 8px var(--rank-b));
                }

                /* A-Rank: Majestic Pulse */
                .a { border: none !important; }
                .a .frame-corner, .a .side-accent, .a .corner-accent { display: none !important; }
                .a-frame {
                    animation: aFramePulse 0.4s infinite alternate ease-in-out;
                }
                .a-frame rect {
                    filter: drop-shadow(0 0 12px var(--rank-a));
                }
                @keyframes aFramePulse {
                    from { transform: scale(1); }
                    to { transform: scale(1.05); }
                }

                /* S-Rank: Unstable Power */
                .s { border: none !important; animation: none !important; }
                .s .frame-corner, .s .side-accent, .s .corner-accent { display: none !important; }
                .s-frame rect {
                    filter: drop-shadow(0 0 20px var(--rank-s)) url(#distortion-s);
                }

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

                /* Shimmer removed for cleaner holographic look */
            `}</style>
        </div>
    );
}
