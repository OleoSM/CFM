import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'CEFIMAT Backend API is running',
        version: '1.0.0'
    });
}
