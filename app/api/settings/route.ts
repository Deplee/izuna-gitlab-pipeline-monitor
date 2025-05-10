import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/settings"

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.gitlab || !data.gitlab.url || !data.gitlab.token) {
      return NextResponse.json(
        {
          error: "Необходимо указать URL GitLab и токен доступа",
        },
        { status: 400 },
      )
    }

    await saveSettings(data)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось сохранить настройки",
      },
      { status: 500 },
    )
  }
}
