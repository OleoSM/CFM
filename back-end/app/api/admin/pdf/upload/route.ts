import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { withAuth } from '@/lib/middleware';
import { extractQuestionsFromPDF } from '@/lib/pdfParser';

// Store in-memory processing status (in production, use Redis or DB)
const processingStatus = new Map<string, {
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    extractedQuestions: any[] | null;
    error: string | null;
}>();

async function uploadHandler(req: NextRequest & { user?: any }) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const unitId = formData.get('unitId') as string;
        const quizTitle = formData.get('quizTitle') as string;

        if (!file || !unitId || !quizTitle) {
            return NextResponse.json(
                { error: 'Missing required fields: file, unitId, quizTitle' },
                { status: 400 }
            );
        }

        if (!file.name.endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'File must be a PDF' },
                { status: 400 }
            );
        }

        // Generate unique upload ID
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Initialize status
        processingStatus.set(uploadId, {
            status: 'processing',
            progress: 0,
            extractedQuestions: null,
            error: null
        });

        // Process PDF in background (don't await)
        processPDF(uploadId, file, unitId, quizTitle).catch(error => {
            processingStatus.set(uploadId, {
                status: 'failed',
                progress: 0,
                extractedQuestions: null,
                error: error.message || 'Unknown error'
            });
        });

        return NextResponse.json({
            uploadId,
            status: 'processing',
            message: 'PDF upload started, check status with /api/admin/pdf/status/:uploadId'
        });

    } catch (error) {
        console.error('PDF upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload PDF' },
            { status: 500 }
        );
    }
}

async function processPDF(uploadId: string, file: File, unitId: string, quizTitle: string) {
    try {
        // Update status: Reading file
        processingStatus.set(uploadId, {
            status: 'processing',
            progress: 25,
            extractedQuestions: null,
            error: null
        });

        // Read file
        const bytes = await file.arrayBuffer();

        // Update status: Extracting questions
        processingStatus.set(uploadId, {
            status: 'processing',
            progress: 50,
            extractedQuestions: null,
            error: null
        });

        // Extract questions
        const questions = await extractQuestionsFromPDF(bytes);

        // Update status: Completed
        processingStatus.set(uploadId, {
            status: 'completed',
            progress: 100,
            extractedQuestions: questions.map((q, idx) => ({
                tempId: `temp_${idx}`,
                questionText: q.questionText,
                options: q.options,
                correctIndex: q.correctIndex,
                hint: q.hint,
                confidence: q.confidence,
                orderIndex: idx
            })),
            error: null
        });

    } catch (error: any) {
        throw error;
    }
}

export const POST = (req: NextRequest) => withAuth(uploadHandler, { requiredRole: 'admin' })(req);
