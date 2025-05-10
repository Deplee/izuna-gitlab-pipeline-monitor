import { NextResponse } from "next/server"
import { getSettings } from "@/lib/settings"

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Verify this is a pipeline event
    if (!payload.object_kind || payload.object_kind !== "pipeline") {
      return NextResponse.json({ message: "Not a pipeline event" }, { status: 200 })
    }

    const settings = await getSettings()

    // Check if notifications are enabled for this status
    const pipelineStatus = payload.object_attributes.status
    if (!settings.notifications.notifyOn[pipelineStatus as keyof typeof settings.notifications.notifyOn]) {
      return NextResponse.json(
        {
          message: `Notifications for ${pipelineStatus} status are disabled`,
        },
        { status: 200 },
      )
    }

    // Format pipeline data
    const pipeline = {
      id: payload.object_attributes.id,
      status: pipelineStatus,
      ref: payload.object_attributes.ref,
      sha: payload.object_attributes.sha,
      web_url: payload.object_attributes.url,
      created_at: payload.object_attributes.created_at,
      updated_at: payload.object_attributes.updated_at,
      duration: payload.object_attributes.duration,
      repository: {
        id: payload.project.id,
        name: payload.project.name,
        path_with_namespace: payload.project.path_with_namespace,
        web_url: payload.project.web_url,
      },
    }

    // Send notifications
    const notifyResponse = await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pipeline }),
    })

    const notifyResult = await notifyResponse.json()

    return NextResponse.json(
      {
        message: "Webhook processed",
        result: notifyResult,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
