import { PipelinesDashboard } from "@/components/pipelines-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">GitLab Pipeline Monitor</h1>
        <ThemeToggle />
      </div>
      <PipelinesDashboard />
    </main>
  )
}
