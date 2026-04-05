import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export function withAuth(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
    options: { requiredRole?: 'admin' | 'student' } = {}
) {
    return async (req: AuthenticatedRequest) => {
        const token = getTokenFromRequest(req);

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check role if required
        if (options.requiredRole && payload.role !== options.requiredRole) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Attach user to request
        req.user = payload;

        return handler(req);
    };
}
