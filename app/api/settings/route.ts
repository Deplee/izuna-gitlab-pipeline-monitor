import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/settings"
import fs from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const settings = await getSettings()
    
    // Проверяем, заданы ли переменные окружения
    const envInfo = {
      gitlabUrlFromEnv: !!process.env.GITLAB_URL,
      gitlabTokenFromEnv: !!process.env.GITLAB_TOKEN
    }
    
    return NextResponse.json({
      ...settings,
      _env: envInfo
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    const urlFromEnv = !!process.env.GITLAB_URL
    const tokenFromEnv = !!process.env.GITLAB_TOKEN
    
    if ((!data.gitlab.url && !urlFromEnv) || (!data.gitlab.token && !tokenFromEnv)) {
      return NextResponse.json(
        {
          error: "Необходимо указать URL GitLab и токен доступа",
        },
        { status: 400 },
      )
    }

    // Ensure data directory exists before saving
    const settingsDir = process.env.SETTINGS_FILE
      ? path.dirname(process.env.SETTINGS_FILE)
      : path.join(process.cwd(), "data")

    try {
      await fs.mkdir(settingsDir, { recursive: true })
    } catch (mkdirError) {
      console.error("Error creating settings directory:", mkdirError)
      return NextResponse.json(
        {
          error: "Не удалось создать директорию для настроек. Проверьте права доступа.",
        },
        { status: 500 },
      )
    }

    // Try to save settings with better error handling
    try {
      await saveSettings(data)
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (saveError) {
      console.error("Error saving settings file:", saveError)
      return NextResponse.json(
        {
          error: `Не удалось сохранить файл настроек: ${saveError instanceof Error ? saveError.message : "неизвестная ошибка"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing settings request:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось обработать запрос настроек",
      },
      { status: 500 },
    )
  }
}

