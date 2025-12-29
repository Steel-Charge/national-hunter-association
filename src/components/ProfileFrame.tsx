import React from 'react';

interface ProfileFrameProps {
    children?: React.ReactNode;
    frameId: string;
    className?: string;
}

export default function ProfileFrame({ children, frameId, className = '' }: ProfileFrameProps) {
    const idLower = frameId.toLowerCase().replace(/ /g, '-');

    return (
        <div className={`profile-frame-container ${idLower} ${className}`}>
            <div className="profile-frame-inner">
                {children}
            </div>

            {/* Base Decorative Accents */}
            <div className="frame-corner top-left"><div className="corner-accent"></div></div>
            <div className="frame-corner top-right"><div className="corner-accent"></div></div>
            <div className="frame-corner bottom-left"><div className="corner-accent"></div></div>
            <div className="frame-corner bottom-right"><div className="corner-accent"></div></div>

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

                .frame-corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    z-index: 55;
                }

                .corner-accent {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: #fff;
                    filter: blur(2px);
                    opacity: 0;
                }

                .side-accent {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.05);
                    opacity: 0;
                }

                /* Default / Common */
                .common { border-color: rgba(0, 229, 255, 0.3); }

                /* RANK FRAMES - Progressive decoration */
                .e { border-color: #555; }
                .d { border: 2px solid var(--rank-d); box-shadow: inset 0 0 15px rgba(100, 240, 100, 0.1); }
                .c { border: 2px solid var(--rank-c); box-shadow: inset 0 0 20px rgba(0, 150, 255, 0.2); }
                .b { 
                    border: 3px solid var(--rank-b); 
                    box-shadow: inset 0 0 25px rgba(255, 215, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.1); 
                }
                .b .frame-corner { border: 4px solid var(--rank-b); width: 50px; height: 50px; }
                
                .a { 
                    border: 3px solid var(--rank-a); 
                    box-shadow: inset 0 0 35px rgba(255, 120, 0, 0.3), 0 0 20px rgba(255, 120, 0, 0.2); 
                    border-style: double;
                }
                .a .frame-corner { border: 5px solid var(--rank-a); width: 60px; height: 60px; }

                .s { 
                    border: 4px solid var(--rank-s); 
                    box-shadow: inset 0 0 50px rgba(255, 0, 255, 0.4), 0 0 30px rgba(255, 0, 255, 0.3);
                    animation: pulseS 2s infinite linear;
                }
                .s .frame-corner { border: 6px solid #fff; width: 70px; height: 70px; mix-blend-mode: overlay; }

                /* TITLE SPECIFIC FRAMES */

                /* Electric/Lightning Themes */
                .streak-of-lightning, .flashstorm, .thunderborn-tyrant {
                    border: 2px solid #00f2ff;
                    box-shadow: inset 0 0 30px rgba(0, 242, 255, 0.3), 0 0 20px rgba(0, 242, 255, 0.2);
                    animation: thunderFlicker 4s infinite step-end;
                }
                .streak-of-lightning:after, .flashstorm:after, .thunderborn-tyrant:after {
                    content: ''; position: absolute; inset: -5px; border: 1px solid #fff; opacity: 0.1; mix-blend-mode: overlay;
                }

                /* Wind/Gale Theme */
                .sovreign-of-the-gale {
                    border: 1px solid #b2ffda;
                    box-shadow: inset 0 0 40px rgba(178, 255, 218, 0.2);
                    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
                    animation: windMorph 8s infinite ease-in-out;
                }

                /* King/Will Theme */
                .unshakable-will, .the-unfallen-king {
                    border: 5px solid #ffd700;
                    border-image: linear-gradient(to bottom, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c) 1;
                    box-shadow: inset 0 0 50px rgba(191, 149, 63, 0.4);
                }

                /* Tactical/Plans Theme */
                .tactical-master, .echo-of-a-thousand-plans {
                    border: 1px solid #00ffcc;
                    background: repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0, 255, 204, 0.05) 20px, rgba(0, 255, 204, 0.05) 40px);
                    box-shadow: 0 0 15px rgba(0, 255, 204, 0.2);
                    clip-path: polygon(5% 0, 95% 0, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0 95%, 0 5%);
                }

                /* Flame/Phoenix Theme */
                .flame-of-will, .phoenix-soul {
                    border: 2px solid #ff4d00;
                    box-shadow: inset 0 0 40px rgba(255, 77, 0, 0.4), 0 0 20px rgba(255, 77, 0, 0.3);
                    animation: flamePulse 2s infinite ease-in-out;
                }

                /* Beast/Wild Theme */
                .wild-instinct, .beastmaster {
                    border: 4px solid #4a2c0f;
                    border-style: solid;
                    box-shadow: inset 0 0 20px rgba(74, 44, 15, 0.5);
                    border-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0 L10 20 L20 0 L30 20" stroke="brown" fill="none"/></svg>') 30 stretch;
                }

                /* Crimson/Relentless Theme */
                .relentless-chase, .crimson-seeker {
                    border: 3px solid #ff0000;
                    box-shadow: inset 0 0 45px rgba(255, 0, 0, 0.4);
                    filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
                }

                /* Ruin/Breaker Theme */
                .precision-breaker, .fist-of-ruin {
                    border: 2px solid #fff;
                    box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.2);
                    border-image: linear-gradient(45deg, #fff, #555) 1;
                    filter: contrast(150%);
                }

                /* Abyss Theme */
                .sink-or-rise, .warden-of-the-abyss {
                    border: 2px solid #001233;
                    background: linear-gradient(to bottom, transparent, rgba(0, 18, 51, 0.4));
                    box-shadow: inset 0 0 60px rgba(0, 18, 51, 0.8);
                }

                /* Chaos/Sage Theme */
                .balance-through-chaos, .soulbreaker-sage {
                    border: 2px solid #9d00ff;
                    box-shadow: inset 0 0 40px rgba(157, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2);
                    animation: chaosRotate 10s infinite linear;
                }

                /* Edge Theme */
                .edge-dancer, .ghost-of-the-edge {
                    border: 1px solid #fff;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                    transform: skew(-2deg);
                    opacity: 0.9;
                }

                /* ANIMATIONS */
                @keyframes pulseS {
                    0% { border-color: var(--rank-s); box-shadow: inset 0 0 40px rgba(255, 0, 255, 0.4); }
                    50% { border-color: #fff; box-shadow: inset 0 0 70px rgba(255, 0, 255, 0.7); }
                    100% { border-color: var(--rank-s); box-shadow: inset 0 0 40px rgba(255, 0, 255, 0.4); }
                }

                @keyframes thunderFlicker {
                    0% { opacity: 1; }
                    92% { opacity: 1; }
                    93% { opacity: 0.5; }
                    94% { opacity: 1; }
                    95% { opacity: 0.2; }
                    96% { opacity: 1; }
                }

                @keyframes windMorph {
                    0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
                    50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
                }

                @keyframes flamePulse {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.02); filter: brightness(1.3); }
                }

                @keyframes chaosRotate {
                    0% { border-style: solid; }
                    25% { border-style: dotted; }
                    50% { border-style: dashed; }
                    75% { border-style: double; }
                }

                /* Alignment for Corners */
                .top-left { top: -2px; left: -2px; border-top: inherit; border-left: inherit; }
                .top-right { top: -2px; right: -2px; border-top: inherit; border-right: inherit; }
                .bottom-left { bottom: -2px; left: -2px; border-bottom: inherit; border-left: inherit; }
                .bottom-right { bottom: -2px; right: -2px; border-bottom: inherit; border-right: inherit; }
            `}</style>
        </div>
    );
}
