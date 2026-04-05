import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';

// Import the status map from upload route
// In production, use Redis or database
const processingStatus = new Map<string, any>();

async function statusHandler(
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ uploadId: string }> }
) {
    try {
        const { uploadId } = await params;

        // Get status from shared map (in upload route)
        // This is a simplification; in production use shared storage
        const status = (global as any).pdfProcessingStatus?.get(uploadId);

        if (!status) {
            return NextResponse.json(
                { error: 'Upload not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(status);

    } catch (error) {
        console.error('Error fetching PDF status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}

export const GET = (req: NextRequest, context: any) =>
    withAuth((r) => statusHandler(r, context), { requiredRole: 'admin' })(req);
