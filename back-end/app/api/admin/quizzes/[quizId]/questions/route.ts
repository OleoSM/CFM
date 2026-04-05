import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const createQuestionSchema = z.object({
    questionText: z.string().min(10),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    hint: z.string().optional(),
    explanation: z.string().optional(),
    orderIndex: z.number(),
    tags: z.array(z.string()).optional(),
    difficulty: z.string().optional()
});

async function getHandler(
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const { quizId } = await params;

        const questions = await prisma.question.findMany({
            where: { quizId },
            select: {
                id: true,
                questionText: true,
                options: true,
                correctIndex: true,
                hint: true,
                explanation: true,
                orderIndex: true,
                tags: true,
                difficulty: true,
                createdAt: true
            },
            orderBy: { orderIndex: 'asc' }
        });

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

async function postHandler(
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const { quizId } = await params;
        const body = await req.json();
        const data = createQuestionSchema.parse(body);

        const question = await prisma.question.create({
            data: {
                ...data,
                quizId
            }
        });

        return NextResponse.json({ question }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error creating question:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}

export const GET = (req: NextRequest, context: any) =>
    withAuth((r) => getHandler(r, context), { requiredRole: 'admin' })(req);

export const POST = (req: NextRequest, context: any) =>
    withAuth((r) => postHandler(r, context), { requiredRole: 'admin' })(req);
