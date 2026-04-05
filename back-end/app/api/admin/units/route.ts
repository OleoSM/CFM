import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const createUnitSchema = z.object({
    key: z.string().regex(/^u\d+$/),
    subject: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
    orderIndex: z.number()
});

async function getHandler(req: NextRequest & { user?: any }) {
    try {
        const units = await prisma.unit.findMany({
            select: {
                id: true,
                key: true,
                subject: true,
                title: true,
                description: true,
                orderIndex: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { quizzes: true }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        return NextResponse.json({ units });

    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }
}

async function postHandler(req: NextRequest & { user?: any }) {
    try {
        const body = await req.json();
        const data = createUnitSchema.parse(body);

        const unit = await prisma.unit.create({
            data
        });

        return NextResponse.json({ unit }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error creating unit:', error);
        return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
    }
}

export const GET = (req: NextRequest) => withAuth(getHandler, { requiredRole: 'admin' })(req);
export const POST = (req: NextRequest) => withAuth(postHandler, { requiredRole: 'admin' })(req);
