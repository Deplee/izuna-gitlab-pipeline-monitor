import { NextResponse } from "next/server"
import { getSettings } from "@/lib/settings"
import type { Pipeline } from "@/types"

export async function POST(request: Request) {
  try {
    const { pipeline } = await request.json()
    const settings = await getSettings()

    // Check if notifications are enabled for this status
    if (!settings.notifications.notifyOn[pipeline.status as keyof typeof settings.notifications.notifyOn]) {
      return NextResponse.json(
        {
          message: `Notifications for ${pipeline.status} status are disabled`,
        },
        { status: 200 },
      )
    }

    const notificationResults = {
      zulip: null as any,
      telegram: null as any,
    }

    // Send Zulip notification
    if (settings.notifications.zulip.enabled) {
      notificationResults.zulip = await sendZulipNotification(pipeline, settings.notifications.zulip)
    }

    // Send Telegram notification
    if (settings.notifications.telegram.enabled) {
      notificationResults.telegram = await sendTelegramNotification(pipeline, settings.notifications.telegram)
    }

    return NextResponse.json(
      {
        message: "Notifications sent",
        results: notificationResults,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}

async function sendZulipNotification(
  pipeline: Pipeline,
  zulipSettings: { url: string; email: string; apiKey: string; stream: string; topic: string },
) {
  try {
    const statusEmoji = getStatusEmoji(pipeline.status)
    const content = `${statusEmoji} Pipeline [#${pipeline.id}](${pipeline.web_url}) for ${pipeline.repository.name} (${pipeline.ref}) is **${pipeline.status}**`

    const response = await fetch(`${zulipSettings.url}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${zulipSettings.email}:${zulipSettings.apiKey}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        type: "stream",
        to: zulipSettings.stream,
        subject: zulipSettings.topic,
        content: content,
      }),
    })

    const data = await response.json()
    return { success: response.ok, data }
  } catch (error) {
    console.error("Error sending Zulip notification:", error)
    return { success: false, error: (error as Error).message }
  }
}

async function sendTelegramNotification(pipeline: Pipeline, telegramSettings: { botToken: string; chatId: string }) {
  try {
    const statusEmoji = getStatusEmoji(pipeline.status)
    const message = `${statusEmoji} Pipeline #${pipeline.id} for ${pipeline.repository.name} (${pipeline.ref}) is ${pipeline.status}\n\n${pipeline.web_url}`

    const response = await fetch(`https://api.telegram.org/bot${telegramSettings.botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramSettings.chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    })

    const data = await response.json()
    return { success: response.ok, data }
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
    return { success: false, error: (error as Error).message }
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "success":
      return "✅"
    case "failed":
      return "❌"
    case "running":
      return "▶️"
    case "pending":
      return "⏳"
    default:
      return "ℹ️"
  }
}
