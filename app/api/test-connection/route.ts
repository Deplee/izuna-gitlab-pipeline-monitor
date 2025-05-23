import { NextResponse } from "next/server"

// Проверка подключения к GitLab API
async function testGitLabConnection(url: string, token: string): Promise<boolean> {
  try {
    console.log(`Testing GitLab connection to ${url}`)
    const response = await fetch(`${url}/api/v4/version`, {
      headers: {
        "PRIVATE-TOKEN": token,
      },
      // @ts-ignore - игнорируем ошибку типа для node-fetch
      rejectUnauthorized: false,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GitLab connection test failed: ${response.status}`, errorText)
      return false
    }

    const data = await response.json()
    console.log("GitLab version:", data)
    return !!data.version
  } catch (error) {
    console.error("GitLab connection test failed:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { url, token } = await request.json()

    if (!url || !token) {
      return NextResponse.json({ error: "URL и токен обязательны" }, { status: 400 })
    }

    console.log(`Testing GitLab connection to ${url}`)
    const isConnected = await testGitLabConnection(url, token)

    if (isConnected) {
      return NextResponse.json({ success: true, message: "Подключение успешно" }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, error: "Не удалось подключиться к GitLab API" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error testing GitLab connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ошибка при проверке подключения к GitLab",
      },
      { status: 500 },
    )
  }
}
