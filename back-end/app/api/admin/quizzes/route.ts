import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const createQuizSchema = z.object({
    unitId: z.string().uuid(),
    key: z.string().regex(/^q\d+$/),
    title: z.string().min(3),
    difficulty: z.enum(['Fácil', 'Medio', 'Difícil']).optional(),
    orderIndex: z.number()
});

async function getHandler(req: NextRequest & { user?: any }) {
    try {
        const quizzes = await prisma.quiz.findMany({
            select: {
                id: true,
                key: true,
                title: true,
                difficulty: true,
                orderIndex: true,
                isActive: true,
                sourcePdfUrl: true,
                createdAt: true,
                updatedAt: true,
                unit: {
                    select: {
                        key: true,
                        title: true
                    }
                },
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: [
                { unit: { orderIndex: 'asc' } },
                { orderIndex: 'asc' }
            ]
        });

        return NextResponse.json({ quizzes });

    } catch (error) {
        console.error('Error fetching quizzes:', error);
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}

async function postHandler(req: NextRequest & { user?: any }) {
    try {
        const body = await req.json();
        const data = createQuizSchema.parse(body);

        const quiz = await prisma.quiz.create({
            data
        });

        return NextResponse.json({ quiz }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error creating quiz:', error);
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }
}

export const GET = (req: NextRequest) => withAuth(getHandler, { requiredRole: 'admin' })(req);
export const POST = (req: NextRequest) => withAuth(postHandler, { requiredRole: 'admin' })(req);
