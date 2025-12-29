import React from 'react';
import { Rarity } from '@/lib/missions';

interface ProfileFrameProps {
    children: React.ReactNode;
    rarity: Rarity;
    className?: string;
}

export default function ProfileFrame({ children, rarity, className = '' }: ProfileFrameProps) {
    const rarityLower = rarity.toLowerCase();

    return (
        <div className={`profile-frame-container ${rarityLower} ${className}`}>
            <div className="profile-frame-inner">
                {children}
            </div>
            {/* Corner Accents */}
            <div className="frame-corner top-left"></div>
            <div className="frame-corner top-right"></div>
            <div className="frame-corner bottom-left"></div>
            <div className="frame-corner bottom-right"></div>

            <style jsx>{`
                .profile-frame-container {
                    position: relative;
                    padding: 8px;
                    display: inline-block;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .profile-frame-inner {
                    position: relative;
                    z-index: 2;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .frame-corner {
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    z-index: 3;
                    pointer-events: none;
                }

                /* Rarity Specific Frames */
                .common {
                    border-color: rgba(0, 229, 255, 0.3);
                    box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
                }
                .common .frame-corner {
                    border: 2px solid var(--rarity-common);
                }

                .rare {
                    border-color: rgba(205, 127, 50, 0.3);
                    box-shadow: 0 0 15px rgba(205, 127, 50, 0.1);
                }
                .rare .frame-corner {
                    border: 2px solid var(--rarity-rare);
                }

                .epic {
                    border-color: rgba(192, 192, 192, 0.3);
                    background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(192,192,192,0.1));
                    box-shadow: 0 0 20px rgba(192, 192, 192, 0.2);
                }
                .epic .frame-corner {
                    border: 2px solid var(--rarity-epic);
                }

                .legendary {
                    border-color: rgba(255, 215, 0, 0.4);
                    background: linear-gradient(135deg, rgba(255,215,0,0.05), rgba(0,0,0,0.4));
                    box-shadow: 0 0 25px rgba(255, 215, 0, 0.2);
                }
                .legendary .frame-corner {
                    border: 3px solid var(--rarity-legendary);
                }

                .mythic {
                    border-color: rgba(255, 42, 87, 0.5);
                    background: rgba(255, 42, 87, 0.05);
                    box-shadow: 0 0 30px rgba(255, 42, 87, 0.3);
                    animation: pulseFrame 2s infinite;
                }
                .mythic .frame-corner {
                    border: 3px solid var(--rarity-mythic);
                }

                .event {
                    border-color: rgba(255, 28, 210, 0.5);
                    background: rgba(255, 28, 210, 0.05);
                    box-shadow: 0 0 30px rgba(255, 28, 210, 0.3);
                }
                .event .frame-corner {
                    border: 3px solid var(--rarity-event);
                }

                @keyframes pulseFrame {
                    0% { box-shadow: 0 0 20px rgba(255, 42, 87, 0.2); }
                    50% { box-shadow: 0 0 40px rgba(255, 42, 87, 0.5); }
                    100% { box-shadow: 0 0 20px rgba(255, 42, 87, 0.2); }
                }

                .top-left { top: -2px; left: -2px; border-right: none !important; border-bottom: none !important; border-top-left-radius: 8px; }
                .top-right { top: -2px; right: -2px; border-left: none !important; border-bottom: none !important; border-top-right-radius: 8px; }
                .bottom-left { bottom: -2px; left: -2px; border-right: none !important; border-top: none !important; border-bottom-left-radius: 8px; }
                .bottom-right { bottom: -2px; right: -2px; border-left: none !important; border-top: none !important; border-bottom-right-radius: 8px; }
            `}</style>
        </div>
    );
}
