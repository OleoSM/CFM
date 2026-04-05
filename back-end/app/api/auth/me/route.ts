import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';

async function handler(req: NextRequest & { user?: any }) {
    return NextResponse.json({
        user: req.user
    });
}

export const GET = (req: NextRequest) => withAuth(handler)(req);
