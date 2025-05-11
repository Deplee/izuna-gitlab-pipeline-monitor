import { NextResponse } from "next/server"
import { testGitLabConnection } from "@/lib/api-client"

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
        error: error instanceof Error ? error.message : "Ошибка при проверке подключения к GitLab" 
      }, 
      { status: 500 }
    )
  }
}
