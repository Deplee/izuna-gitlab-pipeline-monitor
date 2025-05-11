import { NextResponse } from "next/server"
import type { Repository } from "@/types"
import { getSettings } from "@/lib/settings"

export async function GET() {
  try {
    console.log("API: Fetching repositories...")
    const settings = await getSettings()
    console.log(
      "API: Settings loaded:",
      JSON.stringify({
        gitlabUrl: settings.gitlab.url,
        hasToken: !!settings.gitlab.token,
        repositories: settings.gitlab.repositories,
      }),
    )

    if (!settings.gitlab.url || !settings.gitlab.token || !settings.gitlab.repositories) {
      console.log("API: GitLab settings not configured")
      return NextResponse.json({ error: "GitLab settings not configured" }, { status: 400 })
    }

    // Улучшенный парсинг ID репозиториев
    const repositoryIds = settings.gitlab.repositories
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)

    console.log("API: Repository IDs after parsing:", repositoryIds)

    if (repositoryIds.length === 0) {
      console.log("API: No repositories configured")
      return NextResponse.json([], { status: 200 })
    }

    // Fetch repositories
    const repositories: Repository[] = []
    for (const repoId of repositoryIds) {
      console.log(`API: Fetching repository ${repoId} from ${settings.gitlab.url}`)
      try {
        // Проверяем, содержит ли ID слеш (для случаев, когда используется namespace/project_name)
        const encodedRepoId = repoId.includes("/") ? encodeURIComponent(repoId) : repoId
        const repoUrl = `${settings.gitlab.url}/api/v4/projects/${encodedRepoId}`
        console.log(`API: Repository URL: ${repoUrl}`)

        const repoResponse = await fetch(repoUrl, {
          headers: {
            "PRIVATE-TOKEN": settings.gitlab.token,
          },
          // @ts-ignore - игнорируем ошибку типа для node-fetch
          rejectUnauthorized: false,
        })

        if (repoResponse.ok) {
          const repoData = await repoResponse.json()
          console.log(`API: Repository ${repoId} fetched successfully:`, repoData.name)
          repositories.push({
            id: repoData.id,
            name: repoData.name,
            path_with_namespace: repoData.path_with_namespace,
            web_url: repoData.web_url,
          })
        } else {
          const errorText = await repoResponse.text()
          console.error(`API: Failed to fetch repository ${repoId}:`, repoResponse.status, errorText)
          // Пытаемся распарсить JSON ошибки, если возможно
          try {
            const errorJson = JSON.parse(errorText)
            console.error("API: Error details:", errorJson)
          } catch (e) {
            // Если не удалось распарсить JSON, просто логируем текст
          }
        }
      } catch (error) {
        console.error(`API: Error fetching repository ${repoId}:`, error)
      }
    }

    console.log(`API: Fetched ${repositories.length} repositories:`, repositories)
    return NextResponse.json(repositories, { status: 200 })
  } catch (error) {
    console.error("API: Error fetching repositories:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}

