"use client"

import { useState, useEffect } from "react"
import { PipelineList } from "@/components/pipeline-list"
import { PipelineFilters } from "@/components/pipeline-filters"
import { SettingsDialog } from "@/components/settings-dialog"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Pipeline, Repository } from "@/types"

export function PipelinesDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch repositories and pipelines
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if settings are configured
        const settingsResponse = await fetch("/api/settings")
        const settingsData = await settingsResponse.json()

        const hasGitlabConfig =
          settingsData.gitlab &&
          settingsData.gitlab.url &&
          settingsData.gitlab.token &&
          settingsData.gitlab.repositories

        // Only update isConfigured if it changed
        if (hasGitlabConfig !== isConfigured) {
          setIsConfigured(hasGitlabConfig)
        }

        if (!hasGitlabConfig) {
          setIsLoading(false)
          setError("Необходимо настроить подключение к GitLab")
          return
        }

        // Fetch repositories
        const reposResponse = await fetch("/api/repositories")

        if (!reposResponse.ok) {
          throw new Error(`Ошибка при получении репозиториев: ${reposResponse.status} ${reposResponse.statusText}`)
        }

        const reposData = await reposResponse.json()
        setRepositories(reposData)

        // Fetch pipelines
        const pipelinesResponse = await fetch("/api/pipelines")

        if (!pipelinesResponse.ok) {
          throw new Error(
            `Ошибка при получении пайплайнов: ${pipelinesResponse.status} ${pipelinesResponse.statusText}`,
          )
        }

        const pipelinesData = await pipelinesResponse.json()
        setPipelines(pipelinesData)
        setFilteredPipelines(pipelinesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Произошла ошибка при загрузке данных")
        toast({
          title: "Ошибка",
          description: error instanceof Error ? error.message : "Произошла ошибка при загрузке данных",
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
  }, [toast, isConfigured])

  const handleFilterChange = (filteredResults: Pipeline[]) => {
    setFilteredPipelines(filteredResults)
  }

  // If not configured, show configuration message
  if (!isConfigured && !isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Настройка GitLab Pipeline Monitor</CardTitle>
            <CardDescription>Необходимо настроить подключение к GitLab</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center mb-6">
              Для начала работы необходимо настроить подключение к GitLab. Нажмите кнопку ниже, чтобы открыть настройки.
            </p>
            <Button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Открыть настройки
            </Button>
          </CardContent>
        </Card>

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>
    )
  }

  // If there's an error, show error message with settings button
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-500">Ошибка</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center mb-6">Проверьте настройки подключения к GitLab и попробуйте снова.</p>
            <Button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Открыть настройки
            </Button>
          </CardContent>
        </Card>

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Пайплайны</h2>
        <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Настройки
        </Button>
      </div>

      <PipelineFilters pipelines={pipelines} repositories={repositories} onFilterChange={handleFilterChange} />

      <PipelineList pipelines={filteredPipelines} isLoading={isLoading} />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
