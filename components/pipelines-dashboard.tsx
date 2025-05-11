"use client"

import { useState, useEffect, useRef } from "react"
import { PipelineList } from "@/components/pipeline-list"
import { PipelineFilters } from "@/components/pipeline-filters"
import { SettingsDialog } from "@/components/settings-dialog"
import { Settings, RefreshCw } from 'lucide-react'
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Use refs to prevent infinite loops
  const initialFetchDone = useRef(false)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // Fetch repositories and pipelines
  useEffect(() => {
    // Skip the first render to prevent double fetching
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Define the fetch function
    const fetchData = async () => {
      if (!initialFetchDone.current) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      setError(null)

      try {
        console.log("Dashboard: Fetching settings...")
        // Check if settings are configured
        const settingsResponse = await fetch("/api/settings")
        const settingsData = await settingsResponse.json()
        console.log("Dashboard: Settings loaded:", JSON.stringify({
          gitlabUrl: settingsData.gitlab?.url,
          hasToken: !!settingsData.gitlab?.token,
          repositories: settingsData.gitlab?.repositories
        }))

        const hasGitlabConfig =
          settingsData.gitlab &&
          settingsData.gitlab.url &&
          settingsData.gitlab.token &&
          settingsData.gitlab.repositories

        // Only update if the value changed to prevent unnecessary renders
        if (hasGitlabConfig !== isConfigured) {
          setIsConfigured(hasGitlabConfig)
        }

        if (!hasGitlabConfig) {
          setIsLoading(false)
          setIsRefreshing(false)
          setError("Необходимо настроить подключение к GitLab")
          return
        }

        // Fetch repositories
        try {
          console.log("Dashboard: Fetching repositories...")
          const reposResponse = await fetch("/api/repositories")

          if (!reposResponse.ok) {
            const errorData = await reposResponse.json()
            throw new Error(`Ошибка при получении репозиториев: ${reposResponse.status} ${errorData.error || reposResponse.statusText}`)
          }

          const reposData = await reposResponse.json()
          console.log(`Dashboard: Fetched ${reposData.length} repositories`)
          setRepositories(reposData)
        } catch (repoError) {
          console.error("Dashboard: Error fetching repositories:", repoError)
          setError(repoError instanceof Error ? repoError.message : "Ошибка при получении репозиториев")
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }

        // Fetch pipelines
        try {
          console.log("Dashboard: Fetching pipelines...")
          const pipelinesResponse = await fetch("/api/pipelines")

          if (!pipelinesResponse.ok) {
            const errorData = await pipelinesResponse.json()
            throw new Error(
              `Ошибка при получении пайплайнов: ${pipelinesResponse.status} ${errorData.error || pipelinesResponse.statusText}`,
            )
          }

          const pipelinesData = await pipelinesResponse.json()
          console.log(`Dashboard: Fetched ${pipelinesData.length} pipelines`)
          setPipelines(pipelinesData)
          // Only set filtered pipelines on initial load or if they're empty
          if (!initialFetchDone.current || filteredPipelines.length === 0) {
            setFilteredPipelines(pipelinesData)
          }
        } catch (pipelineError) {
          console.error("Dashboard: Error fetching pipelines:", pipelineError)
          setError(pipelineError instanceof Error ? pipelineError.message : "Ошибка при получении пайплайнов")
        }
      } catch (error) {
        console.error("Dashboard: Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Произошла ошибка при загрузке данных")
        if (!initialFetchDone.current) {
          toast({
            title: "Ошибка",
            description: error instanceof Error ? error.message : "Произошла ошибка при загрузке данных",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        initialFetchDone.current = true
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling for updates every 2 minutes
    if (!pollingInterval.current) {
      pollingInterval.current = setInterval(fetchData, 2 * 60 * 1000)
    }

    // Cleanup function
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }
    }
  }, [toast]) // Only depend on toast, not on any state that might change during the effect

  const handleFilterChange = (filteredResults: Pipeline[]) => {
    setFilteredPipelines(filteredResults)
  }

  const handleSettingsSaved = () => {
    // Reset fetch state to trigger a new fetch
    initialFetchDone.current = false
    // Force a re-render to trigger the useEffect
    setIsConfigured(false)
  }

  const handleRefresh = () => {
    // Reset fetch state to trigger a new fetch
    initialFetchDone.current = false
    // Force a re-render to trigger the useEffect
    setIsConfigured((prev) => prev)
  }

  // If not configured, show configuration message
  if (!isConfigured && !isLoading && initialFetchDone.current) {
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

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} onSettingsSaved={handleSettingsSaved} />
      </div>
    )
  }

  // If there's an error, show error message with settings button
  if (error && !isLoading && initialFetchDone.current) {
    return (
      <div className="space-y-6">
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-500">Ошибка</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center mb-6">Проверьте настройки подключения к GitLab и попробуйте снова.</p>
            <div className="flex gap-4">
              <Button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Открыть настройки
              </Button>
              <Button onClick={handleRefresh} className="flex items-center gap-2" variant="outline">
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
            </div>
          </CardContent>
        </Card>

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} onSettingsSaved={handleSettingsSaved} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Пайплайны</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Обновление...' : 'Обновить'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </Button>
        </div>
      </div>

      <PipelineFilters pipelines={pipelines} repositories={repositories} onFilterChange={handleFilterChange} />

      <PipelineList pipelines={filteredPipelines} isLoading={isLoading} />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} onSettingsSaved={handleSettingsSaved} />
    </div>
  )
}
