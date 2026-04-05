import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const answerSchema = z.object({
    attemptId: z.string().uuid(),
    questionId: z.string().uuid(),
    selectedIndex: z.number().min(0).max(3),
    timeSpentSeconds: z.number().optional(),
    usedHint: z.boolean().optional()
});

async function handler(req: NextRequest & { user?: any }) {
    try {
        const body = await req.json();
        const data = answerSchema.parse(body);

        const userId = req.user.userId;

        // Get the question with correct answer
        const question = await prisma.question.findUnique({
            where: { id: data.questionId },
            select: {
                id: true,
                questionText: true,
                correctIndex: true,
                explanation: true,
                orderIndex: true,
                quizId: true
            }
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404 }
            );
        }

        // Verify attempt belongs to user
        const attempt = await prisma.userQuizAttempt.findFirst({
            where: {
                id: data.attemptId,
                userId,
                quizId: question.quizId
            }
        });

        if (!attempt) {
            return NextResponse.json(
                { error: 'Invalid attempt' },
                { status: 403 }
            );
        }

        // Check if correct
        const isCorrect = data.selectedIndex === question.correctIndex;

        // Save answer
        await prisma.userQuestionAttempt.create({
            data: {
                attemptId: data.attemptId,
                questionId: data.questionId,
                selectedIndex: data.selectedIndex,
                isCorrect,
                timeSpentSeconds: data.timeSpentSeconds || null,
                usedHint: data.usedHint || false
            }
        });

        // Get next question
        const nextQuestion = await prisma.question.findFirst({
            where: {
                quizId: question.quizId,
                orderIndex: { gt: question.orderIndex }
            },
            select: {
                id: true,
                questionText: true,
                options: true,
                hint: true,
                orderIndex: true
            },
            orderBy: { orderIndex: 'asc' }
        });

        // If no more questions, complete the attempt
        if (!nextQuestion) {
            const answeredQuestions = await prisma.userQuestionAttempt.count({
                where: { attemptId: data.attemptId }
            });

            const correctAnswers = await prisma.userQuestionAttempt.count({
                where: { attemptId: data.attemptId, isCorrect: true }
            });

            const percentage = (correctAnswers / answeredQuestions) * 100;

            await prisma.userQuizAttempt.update({
                where: { id: data.attemptId },
                data: {
                    completedAt: new Date(),
                    score: correctAnswers,
                    percentage
                }
            });
        }

        return NextResponse.json({
            isCorrect,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
            nextQuestion: nextQuestion || null,
            quizCompleted: !nextQuestion
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error answering question:', error);
        return NextResponse.json(
            { error: 'Failed to submit answer' },
            { status: 500 }
        );
    }
}

export const POST = (req: NextRequest) => withAuth(handler)(req);
