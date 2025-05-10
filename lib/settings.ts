import fs from "fs/promises"
import path from "path"
import type { GitLabSettings, NotificationSettings } from "@/types"

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json")

interface Settings {
  gitlab: GitLabSettings
  notifications: NotificationSettings
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  gitlab: {
    url: "https://gitlab.com",
    token: "",
    repositories: "",
  },
  notifications: {
    zulip: {
      enabled: false,
      url: "",
      email: "",
      apiKey: "",
      stream: "",
      topic: "GitLab Pipelines",
    },
    telegram: {
      enabled: false,
      botToken: "",
      chatId: "",
    },
    notifyOn: {
      success: false,
      failed: true,
      running: false,
      pending: false,
    },
  },
}

export async function getSettings(): Promise<Settings> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true })

    // Try to read settings file
    try {
      const data = await fs.readFile(SETTINGS_FILE, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      // If file doesn't exist or is invalid, create with default settings
      await saveSettings(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    }
  } catch (error) {
    console.error("Error getting settings:", error)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true })

    // Write settings to file
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8")
  } catch (error) {
    console.error("Error saving settings:", error)
    throw error
  }
}
