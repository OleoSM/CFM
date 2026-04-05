import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const confirmSchema = z.object({
    quizId: z.string().uuid(),
    questions: z.array(z.object({
        questionText: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().min(0).max(3),
        hint: z.string().optional(),
        explanation: z.string().optional(),
        orderIndex: z.number(),
        tags: z.array(z.string()).optional(),
        difficulty: z.string().optional()
    }))
});

async function confirmHandler(req: NextRequest & { user?: any }) {
    try {
        const body = await req.json();
        const { quizId, questions } = confirmSchema.parse(body);

        // Verify quiz exists
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId }
        });

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            );
        }

        // Create all questions in a transaction
        const createdQuestions = await prisma.$transaction(
            questions.map(q =>
                prisma.question.create({
                    data: {
                        quizId,
                        questionText: q.questionText,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        hint: q.hint || null,
                        explanation: q.explanation || null,
                        orderIndex: q.orderIndex,
                        tags: q.tags || [],
                        difficulty: q.difficulty || null
                    }
                })
            )
        );

        return NextResponse.json({
            quizId,
            questionsCreated: createdQuestions.length,
            message: 'Quiz created successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error confirming PDF import:', error);
        return NextResponse.json(
            { error: 'Failed to save questions' },
            { status: 500 }
        );
    }
}

export const POST = (req: NextRequest) => withAuth(confirmHandler, { requiredRole: 'admin' })(req);
