export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold font-body mb-6">Task Manager</h1>
      <p className="text-body-2 mb-8">
        Manage your tasks with a clean, maintainable interface
      </p>
      <Card title="Welcome">
        <p className="text-body-1">
          This is a Next.js Task Manager application built with TypeScript and wind CSS.
        </p>
      </Card>
    </main>
  );
}