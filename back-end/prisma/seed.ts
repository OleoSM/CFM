import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cefimat.com' },
        update: {},
        create: {
            email: 'admin@cefimat.com',
            name: 'Admin CEFIMAT',
            passwordHash: adminPassword,
            role: 'admin'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create sample student
    const studentPassword = await hashPassword('student123');
    const student = await prisma.user.upsert({
        where: { email: 'estudiante@demo.com' },
        update: {},
        create: {
            email: 'estudiante@demo.com',
            name: 'Estudiante Demo',
            passwordHash: studentPassword,
            role: 'student',
            groupName: 'Grupo A'
        }
    });
    console.log('✅ Student user created:', student.email);

    // Create units
    const unit1 = await prisma.unit.upsert({
        where: { key: 'u1' },
        update: {},
        create: {
            key: 'u1',
            subject: 'historia_mexico',
            title: 'Historia de México',
            description: 'Cuestionarios sobre la historia de México desde la época prehispánica hasta la actualidad',
            orderIndex: 1
        }
    });
    console.log('✅ Unit created:', unit1.title);

    const unit2 = await prisma.unit.upsert({
        where: { key: 'u2' },
        update: {},
        create: {
            key: 'u2',
            subject: 'historia_universal',
            title: 'Historia Universal',
            description: 'Cuestionarios sobre acontecimientos históricos mundiales',
            orderIndex: 2
        }
    });
    console.log('✅ Unit created:', unit2.title);

    // Create sample quiz
    const quiz1 = await prisma.quiz.upsert({
        where: { id: 'sample-quiz-1' },
        update: {},
        create: {
            id: 'sample-quiz-1',
            unitId: unit1.id,
            key: 'q1',
            title: 'Independencia de México',
            difficulty: 'Medio',
            orderIndex: 1
        }
    });
    console.log('✅ Quiz created:', quiz1.title);

    // Create sample questions
    const questions = [
        {
            quizId: quiz1.id,
            questionText: '¿En qué año comenzó la Guerra de Independencia de México?',
            options: ['1808', '1810', '1821', '1824'],
            correctIndex: 1,
            hint: 'El grito de Dolores marcó el inicio',
            explanation: 'La Independencia de México comenzó el 16 de septiembre de 1810 con el Grito de Dolores.',
            orderIndex: 0,
            tags: ['independencia', 'siglo XIX'],
            difficulty: 'Fácil'
        },
        {
            quizId: quiz1.id,
            questionText: '¿Quién fue el cura que inició el movimiento de Independencia?',
            options: ['José María Morelos', 'Miguel Hidalgo', 'Ignacio Allende', 'Vicente Guerrero'],
            correctIndex: 1,
            hint: 'Era párroco de Dolores',
            explanation: 'Miguel Hidalgo y Costilla fue el sacerdote que dio el Grito de Dolores.',
            orderIndex: 1,
            tags: ['independencia', 'personajes'],
            difficulty: 'Fácil'
        },
        {
            quizId: quiz1.id,
            questionText: '¿En qué año se consumó la Independencia de México?',
            options: ['1810', '1815', '1821', '1824'],
            correctIndex: 2,
            hint: 'Entrada del Ejército Trigarante a la Ciudad de México',
            explanation: 'La Independencia se consumó el 27 de septiembre de 1821 con la entrada triunfal de Iturbide.',
            orderIndex: 2,
            tags: ['independencia', 'fechas'],
            difficulty: 'Medio'
        }
    ];

    for (const q of questions) {
        await prisma.question.create({ data: q });
    }
    console.log('✅ Questions created:', questions.length);

    console.log('\n🎉 Seed completed!');
    console.log('\n📝 Credentials:');
    console.log('Admin: admin@cefimat.com / admin123');
    console.log('Student: estudiante@demo.com / student123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
