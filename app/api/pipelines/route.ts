import { NextResponse } from "next/server"
import type { Pipeline, Repository } from "@/types"
import { getSettings } from "@/lib/settings"

export async function GET() {
  try {
    const settings = await getSettings()

    if (!settings.gitlab.url || !settings.gitlab.token || !settings.gitlab.repositories) {
      return NextResponse.json({ error: "GitLab settings not configured" }, { status: 400 })
    }

    const repositoryIds = settings.gitlab.repositories
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)

    if (repositoryIds.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    // Fetch repositories first
    const repositories: Repository[] = []
    for (const repoId of repositoryIds) {
      const repoResponse = await fetch(`${settings.gitlab.url}/api/v4/projects/${repoId}`, {
        headers: {
          "PRIVATE-TOKEN": settings.gitlab.token,
        },
      })

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        repositories.push({
          id: repoData.id,
          name: repoData.name,
          path_with_namespace: repoData.path_with_namespace,
          web_url: repoData.web_url,
        })
      }
    }

    // Fetch pipelines for each repository
    const allPipelines: Pipeline[] = []

    for (const repo of repositories) {
      const pipelinesResponse = await fetch(`${settings.gitlab.url}/api/v4/projects/${repo.id}/pipelines?per_page=20`, {
        headers: {
          "PRIVATE-TOKEN": settings.gitlab.token,
        },
      })

      if (pipelinesResponse.ok) {
        const pipelinesData = await pipelinesResponse.json()

        const pipelines = pipelinesData.map((pipeline: any) => ({
          id: pipeline.id,
          status: pipeline.status,
          ref: pipeline.ref,
          sha: pipeline.sha,
          web_url: pipeline.web_url,
          created_at: pipeline.created_at,
          updated_at: pipeline.updated_at,
          duration: pipeline.duration,
          repository: repo,
        }))

        allPipelines.push(...pipelines)
      }
    }

    // Sort pipelines by created_at (newest first)
    allPipelines.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allPipelines, { status: 200 })
  } catch (error) {
    console.error("Error fetching pipelines:", error)
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 })
  }
}
