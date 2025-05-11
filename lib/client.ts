/**
 * Клиент для работы с GitLab API
 */
export async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    "PRIVATE-TOKEN": token,
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText)

      // Попытка распарсить JSON ошибки, если возможно
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.message || errorJson.error || `API request failed: ${response.status}`)
      } catch (e) {
        // Если не удалось распарсить JSON, возвращаем текст ошибки
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }
    }

    return response
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

/**
 * Проверка подключения к GitLab API
 */
export async function testGitLabConnection(url: string, token: string): Promise<boolean> {
  try {
    const response = await fetchWithAuth(`${url}/api/v4/version`, token)
    const data = await response.json()
    return !!data.version
  } catch (error) {
    console.error("GitLab connection test failed:", error)
    return false
  }
}

/**
 * Получение информации о репозитории
 */
export async function fetchRepository(gitlabUrl: string, token: string, repoId: string) {
  const response = await fetchWithAuth(`${gitlabUrl}/api/v4/projects/${repoId}`, token)
  return response.json()
}

/**
 * Получение пайплайнов для репозитория
 */
export async function fetchPipelines(gitlabUrl: string, token: string, repoId: string, perPage = 20) {
  const response = await fetchWithAuth(`${gitlabUrl}/api/v4/projects/${repoId}/pipelines?per_page=${perPage}`, token)
  return response.json()
}
