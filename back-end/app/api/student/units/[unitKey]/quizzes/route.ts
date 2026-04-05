import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

async function handler(
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ unitKey: string }> }
) {
    try {
        const { unitKey } = await params;

        const unit = await prisma.unit.findUnique({
            where: { key: unitKey, isActive: true },
            select: {
                id: true,
                quizzes: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        key: true,
                        title: true,
                        difficulty: true,
                        orderIndex: true,
                        _count: {
                            select: { questions: true }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!unit) {
            return NextResponse.json(
                { error: 'Unit not found' },
                { status: 404 }
            );
        }

        const formattedQuizzes = unit.quizzes.map(quiz => ({
            id: quiz.id,
            key: quiz.key,
            title: quiz.title,
            difficulty: quiz.difficulty,
            questionCount: quiz._count.questions
        }));

        return NextResponse.json({ quizzes: formattedQuizzes });

    } catch (error) {
        console.error('Error fetching quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quizzes' },
            { status: 500 }
        );
    }
}

export const GET = (req: NextRequest, context: any) => withAuth((r) => handler(r, context))(req);
