import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

async function handler(req: NextRequest & { user?: any }) {
    try {
        const userId = req.user.userId;

        // Get all completed attempts
        const attempts = await prisma.userQuizAttempt.findMany({
            where: {
                userId,
                completedAt: { not: null }
            },
            select: {
                id: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        unit: {
                            select: {
                                key: true,
                                title: true
                            }
                        }
                    }
                },
                score: true,
                totalQuestions: true,
                percentage: true,
                completedAt: true
            },
            orderBy: { completedAt: 'desc' }
        });

        // Calculate stats
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0
            ? attempts.reduce((sum, a) => sum + (a.percentage?.toNumber() || 0), 0) / totalAttempts
            : 0;

        // Group by unit
        const byUnit = await prisma.$queryRaw`
      SELECT 
        u.key as "unitKey",
        u.title as "unitTitle",
        COUNT(DISTINCT qa.id) as "completed",
        AVG(qa.percentage) as "avgScore"
      FROM user_quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN units u ON q.unit_id = u.id
      WHERE qa.user_id = ${userId}
        AND qa.completed_at IS NOT NULL
      GROUP BY u.key, u.title
      ORDER BY u.order_index
    `;

        return NextResponse.json({
            totalAttempts,
            averageScore: Math.round(averageScore * 100) / 100,
            recentAttempts: attempts.slice(0, 10),
            byUnit
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}

export const GET = (req: NextRequest) => withAuth(handler)(req);
