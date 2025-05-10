import { PipelinesDashboard } from "@/components/pipelines-dashboard"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">GitLab Pipeline Monitor</h1>
      <PipelinesDashboard />
    </main>
  )
}
