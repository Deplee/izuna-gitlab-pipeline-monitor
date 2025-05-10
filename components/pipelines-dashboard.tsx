"use client"

import { useState, useEffect } from "react"
import { PipelineList } from "@/components/pipeline-list"
import { PipelineFilters } from "@/components/pipeline-filters"
import { SettingsDialog } from "@/components/settings-dialog"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Pipeline, Repository } from "@/types"

export function PipelinesDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { toast } = useToast()

  // Fetch repositories and pipelines
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch repositories
        const reposResponse = await fetch("/api/repositories")
        const reposData = await reposResponse.json()
        setRepositories(reposData)

        // Fetch pipelines
        const pipelinesResponse = await fetch("/api/pipelines")
        const pipelinesData = await pipelinesResponse.json()
        setPipelines(pipelinesData)
        setFilteredPipelines(pipelinesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch pipeline data. Please check your GitLab configuration.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up polling for updates every 2 minutes
    const intervalId = setInterval(fetchData, 2 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [toast])

  const handleFilterChange = (filteredResults: Pipeline[]) => {
    setFilteredPipelines(filteredResults)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pipelines</h2>
        <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <PipelineFilters pipelines={pipelines} repositories={repositories} onFilterChange={handleFilterChange} />

      <PipelineList pipelines={filteredPipelines} isLoading={isLoading} />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
