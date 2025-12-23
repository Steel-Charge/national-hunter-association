import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { action, password, hash } = await request.json();

        if (action === 'hash') {
            if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            return NextResponse.json({ hash: hashed });
        }

        if (action === 'compare') {
            if (!password || !hash) return NextResponse.json({ error: 'Password and hash required' }, { status: 400 });
            const match = await bcrypt.compare(password, hash);
            return NextResponse.json({ match });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Hashing API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
