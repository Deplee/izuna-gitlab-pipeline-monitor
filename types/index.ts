export interface Repository {
  id: number
  name: string
  path_with_namespace: string
  web_url: string
}

export interface Pipeline {
  id: number
  status: string
  ref: string
  sha: string
  web_url: string
  created_at: string
  updated_at: string
  duration: number | null
  repository: Repository
}

export interface GitLabSettings {
  url: string
  token: string
  repositories: string
}

export interface NotificationSettings {
  zulip: {
    enabled: boolean
    url: string
    email: string
    apiKey: string
    stream: string
    topic: string
  }
  telegram: {
    enabled: boolean
    botToken: string
    chatId: string
  }
  notifyOn: {
    success: boolean
    failed: boolean
    running: boolean
    pending: boolean
  }
}
