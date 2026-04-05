import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const startQuizSchema = z.object({
    quizId: z.string().uuid()
});

async function handler(req: NextRequest & { user?: any }) {
    try {
        const body = await req.json();
        const { quizId } = startQuizSchema.parse(body);

        const userId = req.user.userId;

        // Get quiz with first question
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId, isActive: true },
            select: {
                id: true,
                title: true,
                difficulty: true,
                questions: {
                    where: {},
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        hint: true,
                        orderIndex: true
                    },
                    orderBy: { orderIndex: 'asc' },
                    take: 1
                },
                _count: {
                    select: { questions: true }
                }
            }
        });

        if (!quiz || quiz.questions.length === 0) {
            return NextResponse.json(
                { error: 'Quiz not found or has no questions' },
                { status: 404 }
            );
        }

        // Create attempt
        const attempt = await prisma.userQuizAttempt.create({
            data: {
                userId,
                quizId,
                totalQuestions: quiz._count.questions
            }
        });

        const firstQuestion = quiz.questions[0];

        return NextResponse.json({
            attemptId: attempt.id,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                difficulty: quiz.difficulty,
                totalQuestions: quiz._count.questions
            },
            question: {
                id: firstQuestion.id,
                questionText: firstQuestion.questionText,
                options: firstQuestion.options,
                hint: firstQuestion.hint,
                orderIndex: firstQuestion.orderIndex
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error starting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to start quiz' },
            { status: 500 }
        );
    }
}

export const POST = (req: NextRequest) => withAuth(handler)(req);
