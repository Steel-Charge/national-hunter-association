import React from 'react';

interface ProfileFrameProps {
    children?: React.ReactNode;
    frameId: string;
    rank?: string;
    className?: string;
}

export default function ProfileFrame({ children, frameId, rank, className = '' }: ProfileFrameProps) {
    const frameClass = frameId.toLowerCase().replace(/ /g, '-');
    const rankClass = rank ? rank.toLowerCase() : '';

    return (
        <div className={`profile-frame-container ${frameClass} ${className}`}>
            <div className={`rank-overlay ${rankClass}`}>
                <div className="rank-bit top-left"></div>
                <div className="rank-bit top-right"></div>
                <div className="rank-bit bottom-left"></div>
                <div className="rank-bit bottom-right"></div>
                <div className="rank-sweep"></div>
            </div>

            <div className="profile-frame-inner">
                {children}
            </div>

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

                /* RANK OVERLAY SYSTEM - Corner/Edge decorations */
                .rank-overlay {
                    position: absolute;
                    inset: -2px;
                    pointer-events: none;
                }

                .rank-bit {
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    opacity: 0.6;
                    border: 1px solid transparent;
                }

                /* Rank Specific Overlays */
                .rank-overlay.c .rank-bit, .rank-overlay.d .rank-bit, .rank-overlay.e .rank-bit { 
                    border-color: rgba(0, 242, 255, 0.3); 
                }

                .rank-overlay.c .rank-bit { 
                    animation: cornerPulse 2s infinite; 
                    border-color: #0096ff;
                }

                .rank-overlay.b .rank-bit { 
                    border-color: #00ff00; 
                    width: 20px; 
                    height: 20px;
                }
                .rank-overlay.b:before, .rank-overlay.b:after {
                    content: '●'; position: absolute; top: 50%; font-size: 6px; color: #00ff00; transform: translateY(-50%);
                }
                .rank-overlay.b:before { left: -5px; } .rank-overlay.b:after { right: -5px; }

                .rank-overlay.a .rank-bit { 
                    border-color: #ffd700; 
                    border-width: 2px; 
                    width: 25px; 
                    height: 25px;
                }
                .rank-overlay.a .rank-sweep {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, #ffd700, transparent);
                    animation: horizontalSweep 6s infinite linear;
                    opacity: 0.2;
                }

                .rank-overlay.s .rank-bit { 
                    border-color: #ff00ff; 
                    border-width: 2px; 
                    box-shadow: 0 0 10px #ff00ff; 
                    width: 30px; 
                    height: 30px;
                }
                .rank-overlay.s:before {
                    content: 'OVERCLOCK // S-RANK'; position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
                    font-size: 7px; color: #ff00ff; letter-spacing: 2px; font-weight: 900; opacity: 0.8;
                }
                .rank-overlay.s { animation: heatHaze 1s infinite alternate; }

                /* RARITY BASE FRAMES (Tactical Style) */
                
                /* Common - Cyan Utilitarian */
                .common { border-color: rgba(0, 229, 255, 0.4); }
                .common:before { content: 'STANDARD ISSUE'; position: absolute; bottom: 2px; right: 8px; font-size: 6px; color: rgba(0, 229, 255, 0.4); letter-spacing: 1px; }

                /* Rare - Bronze Field Certified */
                .rare { border: 1px solid #cd7f32; border-radius: 6px; }
                .rare:after { content: ''; position: absolute; inset: 2px; border: 1px solid rgba(205, 127, 50, 0.3); border-radius: 4px; }
                
                /* Epic - Silver Operational */
                .epic { border: 1px solid rgba(255,255,255,0.2); }
                .epic:before { content: ''; position: absolute; inset: -1px; border: 1px solid #fff; clip-path: polygon(0 0, 15px 0, 0 15px); }
                .epic:after { content: ''; position: absolute; inset: 4px; border: 1px solid rgba(255,255,255,0.1); border-style: dashed; }

                /* Legendary - Gold High Authority */
                .legendary { border: 1px solid #ffd700; background: rgba(255, 215, 0, 0.02); }
                .legendary:before { 
                    content: 'SECURED DATA UNIT'; position: absolute; top: -10px; left: 20px; font-size: 7px; 
                    color: #ffd700; background: #000; padding: 0 6px; border: 1px solid #ffd700;
                }
                .legendary:after { 
                    content: ''; position: absolute; right: -2px; top: 20%; bottom: 20%; width: 1px; 
                    background: repeating-linear-gradient(to bottom, #ffd700, #ffd700 2px, transparent 2px, transparent 4px);
                }

                /* Mythic - Red Classified */
                .mythic { border: 1px solid #ff2a57; box-shadow: inset 0 0 15px rgba(255, 42, 87, 0.1); }
                .mythic:before { content: 'CLASS:X'; position: absolute; top: 10px; left: -10px; transform: rotate(-90deg); font-size: 8px; color: #ff2a57; font-weight: 900; }
                .mythic:after { 
                    content: ''; position: absolute; inset: 0; 
                    background: linear-gradient(rgba(255, 42, 87, 0.05) 50%, transparent 50%);
                    background-size: 100% 4px; pointer-events: none;
                }

                /* Event - Special Dispensation */
                .event { border: 1px solid rgba(255, 28, 210, 0.5); }
                .event:before { content: '※'; position: absolute; top: -5px; left: -5px; font-size: 12px; color: #ff1cd2; }

                /* TITLE SPECIFIC TACTICAL FRAMES */

                /* Lightning / Flash / Thunder */
                .streak-of-lightning, .flashstorm, .thunderborn-tyrant {
                    border: 1px solid #00f2ff;
                    box-shadow: 0 0 10px rgba(0, 242, 255, 0.1);
                }
                .streak-of-lightning:after, .flashstorm:after, .thunderborn-tyrant:after {
                    content: 'VOLTAGE HIGH'; position: absolute; bottom: 2px; right: 5px; font-size: 6px; color: #00f2ff; letter-spacing: 2px;
                }

                /* Gale / Wind */
                .sovreign-of-the-gale {
                    border: 1px solid #b2ffda;
                    clip-path: polygon(0 10%, 10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%);
                }

                /* Will / King / Authority */
                .unshakable-will, .the-unfallen-king {
                    border: 1px solid #ffd700;
                    background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255, 215, 0, 0.03) 5px, rgba(255, 215, 0, 0.03) 10px);
                }

                /* tactical / Plans */
                .tactical-master, .echo-of-a-thousand-plans {
                    border: 1px solid #00ffcc;
                    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="1" height="1" fill="rgba(0,255,204,0.1)"/></svg>');
                }

                /* Flame / Phoenix */
                .flame-of-will, .phoenix-soul {
                    border: 1px solid #ff4d00;
                    box-shadow: 0 0 15px rgba(255, 77, 0, 0.2);
                }
                .flame-of-will:after, .phoenix-soul:after {
                    content: 'THERMAL'; position: absolute; top: 10px; right: -8px; transform: rotate(90deg); font-size: 6px; color: #ff4d00;
                }

                /* Wild / Beast */
                .wild-instinct, .beastmaster {
                    border: 1px solid #fff;
                    border-image: linear-gradient(to bottom, #4a2c0f, #fff, #4a2c0f) 1;
                }

                /* Crimson / Seeker / Chase */
                .relentless-chase, .crimson-seeker {
                    border: 1px solid #ff0000;
                    border-left-width: 4px;
                }
                .relentless-chase:after, .crimson-seeker:after {
                    content: 'TARGET ACQUIRED'; position: absolute; top: -12px; left: 0; font-size: 7px; color: #ff0000; font-weight: 800;
                }

                /* Ruin / Breaker / Fist */
                .precision-breaker, .fist-of-ruin {
                    border: 1px dashed rgba(255, 255, 255, 0.5);
                }

                /* Abyss / Rise / Sink */
                .sink-or-rise, .warden-of-the-abyss {
                    border: 1px solid #001233;
                    box-shadow: inset 0 0 30px #001233;
                }

                /* Chaos / Sage / Balance */
                .balance-through-chaos, .soulbreaker-sage {
                    border: 1px solid #9d00ff;
                }
                .balance-through-chaos:before, .soulbreaker-sage:before {
                    content: ''; position: absolute; inset: -2px; border: 1px dotted #ff00ff; opacity: 0.5;
                }

                /* Edge / Dancer / Ghost */
                .edge-dancer, .ghost-of-the-edge {
                    border: 1px solid #fff;
                    opacity: 0.7;
                    filter: blur(0.3px);
                }

                /* ANIMATIONS */
                @keyframes cornerPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
                @keyframes horizontalSweep { 0% { top: 0; opacity: 0; } 10% { opacity: 0.3; } 90% { opacity: 0.3; } 100% { top: 100%; opacity: 0; } }
                @keyframes verticalScan { 0% { top: 0; } 100% { top: 100%; } }
                @keyframes heatHaze { from { filter: brightness(1); } to { filter: brightness(1.2) contrast(1.1); } }

                /* Corner Alignment */
                .top-left { top: -2px; left: -2px; border-top: inherit; border-left: inherit; }
                .top-right { top: -2px; right: -2px; border-top: inherit; border-right: inherit; }
                .bottom-left { bottom: -2px; left: -2px; border-bottom: inherit; border-left: inherit; }
                .bottom-right { bottom: -2px; right: -2px; border-bottom: inherit; border-right: inherit; }
            `}</style>
        </div>
    );
}
