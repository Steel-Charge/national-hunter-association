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
                <div className="rank-glyph">{rankClass.toUpperCase()}</div>
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

                /* RANK OVERLAY SYSTEM - Scaled up */
                .rank-overlay {
                    position: absolute;
                    inset: -5px;
                    pointer-events: none;
                }

                .rank-bit {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    opacity: 0.8;
                    border: 2px solid transparent;
                }

                .rank-glyph {
                    position: absolute;
                    top: -12px;
                    left: 20px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    opacity: 0;
                }

                /* Rank Specific Overlays */
                .rank-overlay.e .rank-bit { border-color: rgba(255,255,255,0.2); }
                .rank-overlay.d .rank-bit { border-color: #00ff00; opacity: 0.4; }
                .rank-overlay.c .rank-bit { border-color: #0096ff; animation: cornerPulse 2s infinite; }
                .rank-overlay.c .rank-glyph { opacity: 0.6; color: #0096ff; }

                .rank-overlay.b .rank-bit { border-color: #00ff00; width: 30px; height: 30px; border-width: 2px; }
                .rank-overlay.b .rank-glyph { opacity: 0.8; color: #00ff00; }

                .rank-overlay.a .rank-bit { 
                    border-color: #ffd700; border-width: 3px; width: 35px; height: 35px;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
                }
                .rank-overlay.a .rank-glyph { opacity: 1; color: #ffd700; text-shadow: 0 0 5px #ffd700; }
                .rank-overlay.a .rank-sweep {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 2px;
                    background: linear-gradient(90deg, transparent, #ffd700, transparent);
                    animation: horizontalSweep 5s infinite linear;
                }

                .rank-overlay.s .rank-bit { 
                    border-color: #ff00ff; border-width: 3px; width: 40px; height: 40px;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
                }
                .rank-overlay.s .rank-glyph { opacity: 1; color: #ff00ff; text-shadow: 0 0 10px #ff00ff; top: -18px; }
                .rank-overlay.s { animation: heatHaze 1s infinite alternate; }

                /* RARITY BASE FRAMES - Differentiated Geometry */
                
                /* Common - Rectangular HUD */
                .common { border: 1px solid rgba(0, 229, 255, 0.5); }
                .common:before { content: 'STANDARD_ISSUE_V1.0'; position: absolute; bottom: 5px; right: 10px; font-size: 8px; color: #00f2ff; opacity: 0.5; }

                /* Rare - Notched Copper */
                .rare { 
                    border: 2px solid #cd7f32; 
                    clip-path: polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%);
                }
                .rare:after { content: 'FIELD_CERT'; position: absolute; top: 5px; left: 10px; font-size: 8px; color: #cd7f32; font-weight: 800; }

                /* Epic - Angular Silver */
                .epic { 
                    border: 2px solid #fff; 
                    clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%);
                }
                .epic:before { content: '/// OPERATIONAL_CLEARANCE ///'; position: absolute; top: -10px; width: 100%; text-align: center; font-size: 7px; color: #fff; letter-spacing: 3px; }
                .epic .profile-frame-inner { animation: shimmerPass 4s infinite linear; }

                /* Legendary - Segmented Gold */
                .legendary { 
                    border: 1px solid #ffd700;
                    clip-path: polygon(0 15px, 15px 0, 80% 0, 80% 8px, 100% 8px, 100% 80%, 92% 80%, 92% 100%, 15px 100%, 0 85%);
                }
                .legendary:before { 
                    content: 'HIGH_AUTHORITY_UNIT'; position: absolute; top: 15px; right: 15px; font-size: 9px; 
                    color: #ffd700; background: #000; border: 1px solid #ffd700; padding: 2px 8px; font-weight: 900;
                }
                .legendary:after { 
                    content: 'ID:779-ALPHA'; position: absolute; bottom: 15px; left: 15px; font-size: 7px; color: #ffd700; opacity: 0.7;
                }

                /* Mythic - Classified aggressive Geometry */
                .mythic { 
                    border: 2px solid #ff2a57;
                    clip-path: polygon(0 0, 30% 0, 35% 10px, 65% 10px, 70% 0, 100% 0, 100% 70%, 90% 75%, 90% 100%, 0 100%);
                }
                .mythic:before { 
                    content: 'CLASSIFIED_PROTOCOL_X'; position: absolute; top: -12px; left: 0; font-size: 10px; 
                    color: #ff2a57; font-weight: 900; text-shadow: 0 0 10px #ff2a57;
                }
                .mythic:after { 
                    content: '║▌║█║▌│║▌║▌█║'; position: absolute; bottom: 5px; width: 100%; text-align: center; font-size: 12px; color: #ff2a57; opacity: 0.6;
                }

                /* Event - Fancy Stylized */
                .event { 
                    border: 2px solid #ff1cd2;
                    clip-path: polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%, 0 30%, 10px 30%, 10px 10%);
                }
                .event:before { content: '★ SPECIAL_DISPENSATION ★'; position: absolute; top: 12px; left: 15px; font-size: 8px; color: #ff1cd2; font-weight: 800; }

                /* TITLE SPECIFIC TACTICAL REFINEMENTS */
                .streak-of-lightning, .flashstorm, .thunderborn-tyrant {
                    border: 2px solid #00f2ff;
                    clip-path: polygon(0 0, 100% 0, 100% 90%, 95% 90%, 95% 100%, 0 100%);
                }
                .streak-of-lightning:after { content: '⚡ VOLTAGE_CRITICAL'; position: absolute; right: 10px; bottom: 10px; font-size: 8px; color: #00f2ff; }

                .sovreign-of-the-gale {
                    border: 2px solid #b2ffda;
                    border-radius: 40px 0 40px 0;
                }

                .phoenix-soul, .flame-of-will {
                    border: 2px solid #ff4d00;
                    clip-path: polygon(0 20%, 10% 0, 90% 0, 100% 20%, 100% 100%, 0 100%);
                }
                .phoenix-soul:after { content: '🔥 THERMAL_BURST'; position: absolute; top: 15px; right: 15px; font-size: 8px; color: #ff4d00; }

                /* ANIMATIONS */
                @keyframes cornerPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
                @keyframes horizontalSweep { 0% { top: 0; opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { top: 100%; opacity: 0; } }
                @keyframes shimmerPass { 
                    0% { background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%); background-size: 200% 200%; background-position: -100% -100%; }
                    100% { background-position: 100% 100%; }
                }
                @keyframes heatHaze { from { filter: brightness(1) contrast(1); } to { filter: brightness(1.3) contrast(1.2) hue-rotate(5deg); } }

                /* Corner Alignment */
                .top-left { top: -5px; left: -5px; border-top: inherit; border-left: inherit; }
                .top-right { top: -5px; right: -5px; border-top: inherit; border-right: inherit; }
                .bottom-left { bottom: -5px; left: -5px; border-bottom: inherit; border-left: inherit; }
                .bottom-right { bottom: -5px; right: -5px; border-bottom: inherit; border-right: inherit; }
            `}</style>
        </div>
    );
}
