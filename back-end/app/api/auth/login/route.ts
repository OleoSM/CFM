import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = loginSchema.parse(body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await comparePassword(data.password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Create token
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                groupName: user.groupName
            },
            token
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
