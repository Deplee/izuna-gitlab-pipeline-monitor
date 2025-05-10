import { NextResponse } from "next/server"
import type { Repository } from "@/types"
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

    // Fetch repositories
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

    return NextResponse.json(repositories, { status: 200 })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}
