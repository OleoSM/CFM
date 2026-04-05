import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

async function handler(req: NextRequest & { user?: any }) {
    try {
        const units = await prisma.unit.findMany({
            where: { isActive: true },
            select: {
                id: true,
                key: true,
                title: true,
                description: true,
                orderIndex: true,
                _count: {
                    select: { quizzes: { where: { isActive: true } } }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        const formattedUnits = units.map(unit => ({
            id: unit.id,
            key: unit.key,
            title: unit.title,
            description: unit.description,
            quizCount: unit._count.quizzes
        }));

        return NextResponse.json({ units: formattedUnits });

    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json(
            { error: 'Failed to fetch units' },
            { status: 500 }
        );
    }
}

export const GET = (req: NextRequest) => withAuth(handler)(req);
