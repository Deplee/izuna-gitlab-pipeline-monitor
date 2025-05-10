"use client"

import { useState, useEffect } from "react"
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

export function PipelineFilters({ pipelines, repositories, onFilterChange }: PipelineFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [repoFilter, setRepoFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("")
  const [displayCount, setDisplayCount] = useState<number>(10)

  // Get unique branches from pipelines
  const branches = [...new Set(pipelines.map((p) => p.ref))]

  useEffect(() => {
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
  }, [statusFilter, repoFilter, branchFilter, displayCount, pipelines, onFilterChange])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-filter">Repository</Label>
            <Select value={repoFilter} onValueChange={setRepoFilter}>
              <SelectTrigger id="repo-filter">
                <SelectValue placeholder="Select repository" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Repositories</SelectItem>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id.toString()}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-filter">Branch</Label>
            <Input
              id="branch-filter"
              placeholder="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="display-count">Display Count: {displayCount}</Label>
            </div>
            <Slider
              id="display-count"
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
}
