'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import { X, Check, XCircle } from 'lucide-react';
import styles from '@/app/missions/page.module.css';

interface TitleRequest {
    id: string;
    quest_id: string;
    title_name: string;
    title_rarity: string;
    requested_at: string;
}

export default function HunterMissionsPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const { profile: viewerProfile, getRequestsForUser, approveRequest, denyRequest, getTheme } = useHunterStore();
    const [requests, setRequests] = useState<TitleRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!username) return;
            const data = await getRequestsForUser(username);
            setRequests(data);
            setLoading(false);
        };

        if (viewerProfile?.isAdmin) {
            fetchRequests();
        }
    }, [username, viewerProfile, getRequestsForUser]);

    const themeRank = getTheme();
    const rankColor = `var(--rank-${themeRank.toLowerCase()})`;

    if (!viewerProfile?.isAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.content} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: '30px'
                }}>
                    <div style={{
                        fontSize: '5rem',
                        opacity: 0.3
                    }}>
                        🔒
                    </div>
                    <h1 style={{
                        color: '#ef4444',
                        textAlign: 'center',
                        fontSize: '2rem',
                        margin: 0
                    }}>
                        Access Denied
                    </h1>
                    <p style={{
                        color: '#888',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        maxWidth: '400px',
                        margin: 0
                    }}>
                        Only administrators can view and manage title requests.
                    </p>
                    <button
                        onClick={() => router.push('/batch3')}
                        style={{
                            background: rankColor,
                            border: 'none',
                            color: '#fff',
                            padding: '15px 40px',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '20px',
                            boxShadow: `0 0 20px ${rankColor}40`
                        }}
                    >
                        Return to Batch 3
                    </button>
                </div>
                <Navbar />
            </div>
        );
    }

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading...</div>;

    const handleApprove = async (requestId: string) => {
        await approveRequest(requestId, username);
        // Refresh requests
        const data = await getRequestsForUser(username);
        setRequests(data);
    };

    const handleDeny = async (requestId: string) => {
        await denyRequest(requestId);
        // Refresh requests
        const data = await getRequestsForUser(username);
        setRequests(data);
    };

    const getRarityColor = (rarity: string) => {
        return `var(--rarity-${rarity.toLowerCase()})`;
    };

    return (
        <div className={styles.container}>
            {/* Close Button */}
            <button
                onClick={() => router.push('/batch3')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: `2px solid ${rankColor}`,
                    color: rankColor,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 1000
                }}
            >
                <X size={40} />
            </button>

            <div className={styles.content}>
                <h1 style={{ color: rankColor, textAlign: 'center', marginBottom: '30px' }}>
                    {username}'s Title Requests
                </h1>

                {requests.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', fontSize: '1.2rem' }}>
                        No pending requests
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                style={{
                                    background: 'rgba(0,0,0,0.5)',
                                    border: `2px solid ${getRarityColor(request.title_rarity)}`,
                                    borderRadius: '10px',
                                    padding: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <h3 style={{ color: getRarityColor(request.title_rarity), margin: '0 0 10px 0' }}>
                                        {request.title_name}
                                    </h3>
                                    <p style={{ color: '#888', margin: '0', fontSize: '0.9rem' }}>
                                        Quest ID: {request.quest_id}
                                    </p>
                                    <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                        Requested: {new Date(request.requested_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        style={{
                                            background: '#10b981',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <Check size={20} />
                                        APPROVE
                                    </button>
                                    <button
                                        onClick={() => handleDeny(request.id)}
                                        style={{
                                            background: '#ef4444',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '10px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <XCircle size={20} />
                                        DENY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Navbar />
        </div>
    );
}
