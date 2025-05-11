import { NextResponse } from "next/server"
import type { Pipeline, Repository } from "@/types"
import { getSettings } from "@/lib/settings"

export async function GET() {
  try {
    console.log("API: Fetching pipelines...")
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

    // Fetch repositories first
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

    console.log(`API: Fetched ${repositories.length} repositories`)

    // Если не удалось получить ни одного репозитория, возвращаем пустой массив
    if (repositories.length === 0) {
      console.log("API: No repositories found, returning empty pipelines array")
      return NextResponse.json([], { status: 200 })
    }

    // Fetch pipelines for each repository
    const allPipelines: Pipeline[] = []

    for (const repo of repositories) {
      console.log(`API: Fetching pipelines for repository ${repo.id} (${repo.name})`)
      try {
        // Используем более полный URL с параметрами для получения большего количества пайплайнов
        const pipelinesUrl = `${settings.gitlab.url}/api/v4/projects/${repo.id}/pipelines?per_page=50&order_by=updated_at&sort=desc`
        console.log(`API: Pipelines URL: ${pipelinesUrl}`)

        const pipelinesResponse = await fetch(pipelinesUrl, {
          headers: {
            "PRIVATE-TOKEN": settings.gitlab.token,
          },
          // @ts-ignore - игнорируем ошибку типа для node-fetch
          rejectUnauthorized: false,
        })

        if (pipelinesResponse.ok) {
          const pipelinesData = await pipelinesResponse.json()
          console.log(`API: Fetched ${pipelinesData.length} pipelines for repository ${repo.id}`)

          // Проверяем, что pipelinesData - это массив
          if (Array.isArray(pipelinesData)) {
            // Выводим первый пайплайн для отладки
            if (pipelinesData.length > 0) {
              console.log(`API: First pipeline example:`, JSON.stringify(pipelinesData[0]))
            }
            
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
          } else {
            console.error(`API: Unexpected pipelines data format for repository ${repo.id}:`, pipelinesData)
          }
        } else {
          const errorText = await pipelinesResponse.text()
          console.error(
            `API: Failed to fetch pipelines for repository ${repo.id}:`,
            pipelinesResponse.status,
            errorText,
          )
          // Пытаемся распарсить JSON ошибки, если возможно
          try {
            const errorJson = JSON.parse(errorText)
            console.error("API: Error details:", errorJson)
          } catch (e) {
            // Если не удалось распарсить JSON, просто логируем текст
          }
        }
      } catch (error) {
        console.error(`API: Error fetching pipelines for repository ${repo.id}:`, error)
      }
    }

    console.log(`API: Total pipelines fetched: ${allPipelines.length}`)

    // Sort pipelines by created_at (newest first)
    allPipelines.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allPipelines, { status: 200 })
  } catch (error) {
    console.error("API: Error fetching pipelines:", error)
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 })
  }
}

