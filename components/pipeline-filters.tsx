"use client"

import { useState, useEffect, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { Pipeline, Repository } from "@/types"

interface PipelineFiltersProps {
  pipelines: Pipeline[]
  repositories: Repository[]
  onFilterChange: (filteredPipelines: Pipeline[]) => void
}

export const PipelineFilters = memo(function PipelineFilters({
  pipelines,
  repositories,
  onFilterChange,
}: PipelineFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [repoFilter, setRepoFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("")
  const [displayCount, setDisplayCount] = useState<number>(10)

  // Track if filters have been initialized
  const [filtersInitialized, setFiltersInitialized] = useState(false)

  // Apply filters when dependencies change
  useEffect(() => {
    // Skip if pipelines are empty (initial load)
    if (pipelines.length === 0) return

    // Apply filters
    let filtered = [...pipelines]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Filter by repository
    if (repoFilter !== "all") {
      filtered = filtered.filter((p) => p.repository.id.toString() === repoFilter)
    }

    // Filter by branch
    if (branchFilter) {
      filtered = filtered.filter((p) => p.ref.toLowerCase().includes(branchFilter.toLowerCase()))
    }

    // Apply display count (this is handled in the PipelineList component)
    onFilterChange(filtered)

    // Mark filters as initialized
    if (!filtersInitialized) {
      setFiltersInitialized(true)
    }
  }, [statusFilter, repoFilter, branchFilter, pipelines, onFilterChange, filtersInitialized])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter-select">Статус</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
              }}
            >
              <SelectTrigger id="status-filter-select">
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="success">Успешно</SelectItem>
                <SelectItem value="failed">Ошибка</SelectItem>
                <SelectItem value="running">Выполняется</SelectItem>
                <SelectItem value="pending">В ожидании</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-filter-select">Репозиторий</Label>
            <Select
              value={repoFilter}
              onValueChange={(value) => {
                setRepoFilter(value)
              }}
            >
              <SelectTrigger id="repo-filter-select">
                <SelectValue placeholder="Выберите репозиторий" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все репозитории</SelectItem>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id.toString()}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-filter-input">Ветка</Label>
            <Input
              id="branch-filter-input"
              placeholder="Фильтр по ветке"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="display-count-slider">Количество: {displayCount}</Label>
            </div>
            <Slider
              id="display-count-slider"
              min={5}
              max={50}
              step={5}
              value={[displayCount]}
              onValueChange={(values) => setDisplayCount(values[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
