import fs from "fs/promises"
import path from "path"
import type { GitLabSettings, NotificationSettings } from "@/types"

// Изменим путь к файлу настроек, чтобы он был доступен в Docker
const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(process.cwd(), "data", "settings.json")

interface Settings {
  gitlab: GitLabSettings
  notifications: NotificationSettings
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  gitlab: {
    url: process.env.GITLAB_URL || "https://gitlab.com",
    token: process.env.GITLAB_TOKEN || "",
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
    const settingsDir = path.dirname(SETTINGS_FILE)
    try {
      await fs.mkdir(settingsDir, { recursive: true })
    } catch (err) {
      console.warn("Could not create settings directory:", err)
      // Continue anyway, we'll handle file errors separately
    }

    // Try to read settings file
    try {
      const data = await fs.readFile(SETTINGS_FILE, "utf-8")
      const savedSettings = JSON.parse(data)

      // Всегда используем URL и токен из переменных окружения, если они заданы
      if (process.env.GITLAB_URL) {
        savedSettings.gitlab.url = process.env.GITLAB_URL
      }

      if (process.env.GITLAB_TOKEN) {
        savedSettings.gitlab.token = process.env.GITLAB_TOKEN
      }

      return savedSettings
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.log("Settings file not found, creating with defaults")
        // If file doesn't exist, create with default settings
        try {
          await saveSettings(DEFAULT_SETTINGS)
        } catch (saveError) {
          console.error("Failed to save default settings:", saveError)
          // If we can't save, just return defaults without saving
        }
        return DEFAULT_SETTINGS
      }

      console.error("Error reading settings file:", error)
      return DEFAULT_SETTINGS
    }
  } catch (error) {
    console.error("Error getting settings:", error)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    // Всегда используем URL и токен из переменных окружения, если они заданы
    if (process.env.GITLAB_URL) {
      settings.gitlab.url = process.env.GITLAB_URL
    }

    if (process.env.GITLAB_TOKEN) {
      settings.gitlab.token = process.env.GITLAB_TOKEN
    }

    // Ensure data directory exists
    const settingsDir = path.dirname(SETTINGS_FILE)
    try {
      await fs.mkdir(settingsDir, { recursive: true })
    } catch (err) {
      console.error("Could not create settings directory:", err)
      throw new Error(`Не удалось создать директорию для настроек: ${(err as Error).message}`)
    }

    // Упрощаем проверку прав доступа - просто пытаемся записать файл
    try {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8")
    } catch (err) {
      console.error("Error writing settings file:", err)
      throw new Error(`Ошибка записи файла настроек: ${(err as Error).message}`)
    }
  } catch (error) {
    console.error("Error saving settings:", error)
    throw error
  }
}
