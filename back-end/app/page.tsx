export default function HomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center space-y-6 p-8">
                <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    CEFIMAT Backend
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Sistema de cuestionarios - Backend + Admin Dashboard
                </p>

                <div className="flex gap-4 justify-center mt-8">
                    <a
                        href="/api/health"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Health Check
                    </a>
                    <a
                        href="/admin"
                        className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Admin Dashboard
                    </a>
                </div>

                <div className="mt-12 text-sm text-slate-500 dark:text-slate-600 space-y-2">
                    <p>✅ Next.js 15 + TypeScript</p>
                    <p>✅ Prisma + PostgreSQL</p>
                    <p>✅ API Routes</p>
                </div>
            </div>
        </div>
    );
}
