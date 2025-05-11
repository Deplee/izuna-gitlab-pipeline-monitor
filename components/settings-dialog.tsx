"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { GitLabSettings, NotificationSettings } from "@/types"
import { NotificationStatusSelector } from "@/components/notification-status-selector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsSaved?: () => void
}

export function SettingsDialog({ open, onOpenChange, onSettingsSaved }: SettingsDialogProps) {
  const [gitlabSettings, setGitlabSettings] = useState<GitLabSettings>({
    url: "",
    token: "",
    repositories: "",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
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
  })

  const [isSaving, setIsSaving] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [isGitLabFromEnv, setIsGitLabFromEnv] = useState({
    url: false,
    token: false,
  })
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load settings on open
  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      // Only fetch if dialog is open and settings haven't been loaded yet
      if (!open || settingsLoaded) return

      try {
        const response = await fetch("/api/settings")
        if (response.ok && isMounted) {
          const data = await response.json()

          if (data.gitlab) {
            setGitlabSettings({
              url: data.gitlab.url || "",
              token: data.gitlab.token || "",
              repositories: data.gitlab.repositories || "",
            })

            // Проверяем, заданы ли переменные окружения
            setIsGitLabFromEnv({
              url: !!data._env?.gitlabUrlFromEnv,
              token: !!data._env?.gitlabTokenFromEnv,
            })
          }

          if (data.notifications) {
            setNotificationSettings({
              zulip: {
                enabled: data.notifications.zulip?.enabled || false,
                url: data.notifications.zulip?.url || "",
                email: data.notifications.zulip?.email || "",
                apiKey: data.notifications.zulip?.apiKey || "",
                stream: data.notifications.zulip?.stream || "",
                topic: data.notifications.zulip?.topic || "GitLab Pipelines",
              },
              telegram: {
                enabled: data.notifications.telegram?.enabled || false,
                botToken: data.notifications.telegram?.botToken || "",
                chatId: data.notifications.telegram?.chatId || "",
              },
              notifyOn: {
                success: data.notifications.notifyOn?.success || false,
                failed: data.notifications.notifyOn?.failed || true,
                running: data.notifications.notifyOn?.running || false,
                pending: data.notifications.notifyOn?.pending || false,
              },
            })
          }

          setSettingsLoaded(true)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        if (isMounted) {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить настройки",
            variant: "destructive",
          })
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [open, toast, settingsLoaded])

  // Reset loaded state when dialog closes
  useEffect(() => {
    if (!open) {
      setSettingsLoaded(false)
      setConnectionStatus("idle")
      setConnectionError(null)
    }
  }, [open])

  const testConnection = useCallback(async () => {
    if (!gitlabSettings.url || !gitlabSettings.token) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать URL и токен GitLab для проверки подключения",
        variant: "destructive",
      })
      return
    }

    setConnectionStatus("testing")
    setConnectionError(null)

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: gitlabSettings.url,
          token: gitlabSettings.token,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus("success")
      } else {
        setConnectionStatus("error")
        setConnectionError(data.error || "Не удалось подключиться к GitLab API")
      }
    } catch (error) {
      setConnectionStatus("error")
      setConnectionError(error instanceof Error ? error.message : "Произошла ошибка при проверке подключения")
    }
  }, [gitlabSettings.url, gitlabSettings.token, toast])

  const handleSaveSettings = useCallback(async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!gitlabSettings.url && !isGitLabFromEnv.url) {
        toast({
          title: "Ошибка",
          description: "URL GitLab обязателен для заполнения",
          variant: "destructive",
        })
        return
      }

      if (!gitlabSettings.token && !isGitLabFromEnv.token) {
        toast({
          title: "Ошибка",
          description: "Токен доступа GitLab обязателен для заполнения",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gitlab: gitlabSettings,
          notifications: notificationSettings,
        }),
      })

      if (response.ok) {
        toast({
          title: "Настройки сохранены",
          description: "Ваши настройки успешно сохранены",
        })

        // Call the callback if provided
        if (onSettingsSaved) {
          onSettingsSaved()
        }

        onOpenChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Не удалось сохранить настройки")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить настройки",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [gitlabSettings, notificationSettings, toast, onOpenChange, onSettingsSaved, isGitLabFromEnv])

  // Handle GitLab settings changes
  const updateGitlabSetting = useCallback((key: keyof GitLabSettings, value: string) => {
    setGitlabSettings((prev) => ({
      ...prev,
      [key]: value,
    }))

    // Reset connection status when URL or token changes
    if (key === "url" || key === "token") {
      setConnectionStatus("idle")
      setConnectionError(null)
    }
  }, [])

  // Handle Zulip settings changes
  const updateZulipSetting = useCallback((key: string, value: any) => {
    setNotificationSettings((prev) => ({
      ...prev,
      zulip: {
        ...prev.zulip,
        [key]: value,
      },
    }))
  }, [])

  // Handle Telegram settings changes
  const updateTelegramSetting = useCallback((key: string, value: any) => {
    setNotificationSettings((prev) => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        [key]: value,
      },
    }))
  }, [])

  // Handle notification status changes
  const updateNotificationStatus = useCallback((key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      notifyOn: {
        ...prev.notifyOn,
        [key]: value,
      },
    }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>Настройте подключение к GitLab и параметры уведомлений</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gitlab">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gitlab">GitLab</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="zulip">Zulip</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>

          <TabsContent value="gitlab" className="space-y-4 py-4">
            {(isGitLabFromEnv.url || isGitLabFromEnv.token) && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Настройки из переменных окружения</AlertTitle>
                <AlertDescription>
                  {isGitLabFromEnv.url && isGitLabFromEnv.token
                    ? "URL и токен GitLab настроены через переменные окружения и не могут быть изменены через интерфейс."
                    : isGitLabFromEnv.url
                      ? "URL GitLab настроен через переменную окружения и не может быть изменен через интерфейс."
                      : "Токен GitLab настроен через переменную окружения и не может быть изменен через интерфейс."}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="gitlab-url-input">URL GitLab</Label>
              <div className="flex gap-2">
                <Input
                  id="gitlab-url-input"
                  placeholder="https://gitlab.com"
                  value={gitlabSettings.url}
                  onChange={(e) => updateGitlabSetting("url", e.target.value)}
                  disabled={isGitLabFromEnv.url}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={connectionStatus === "testing" || !gitlabSettings.url || !gitlabSettings.token}
                >
                  {connectionStatus === "testing" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    "Проверить"
                  )}
                </Button>
              </div>
              {isGitLabFromEnv.url && (
                <p className="text-xs text-muted-foreground">Задано через переменную окружения GITLAB_URL</p>
              )}

              {connectionStatus === "success" && (
                <div className="flex items-center text-green-500 mt-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Подключение успешно</span>
                </div>
              )}

              {connectionStatus === "error" && (
                <div className="flex items-center text-red-500 mt-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{connectionError || "Ошибка подключения"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-token-input">Персональный токен доступа</Label>
              <Input
                id="gitlab-token-input"
                type="password"
                placeholder="glpat-xxxxxxxxx"
                value={gitlabSettings.token}
                onChange={(e) => updateGitlabSetting("token", e.target.value)}
                disabled={isGitLabFromEnv.token}
              />
              {isGitLabFromEnv.token ? (
                <p className="text-xs text-muted-foreground">Задано через переменную окружения GITLAB_TOKEN</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Создайте токен с правами api в GitLab &gt; Settings &gt; Access Tokens
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-repos-input">Репозитории (ID проектов)</Label>
              <Input
                id="gitlab-repos-input"
                placeholder="123,456,789"
                value={gitlabSettings.repositories}
                onChange={(e) => updateGitlabSetting("repositories", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Список ID проектов GitLab для мониторинга, разделенных запятыми
              </p>
            </div>
          </TabsContent>

          <TabsContent value="zulip" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="zulip-enabled-switch"
                checked={notificationSettings.zulip.enabled}
                onCheckedChange={(checked) => updateZulipSetting("enabled", checked)}
              />
              <Label htmlFor="zulip-enabled-switch">Включить уведомления Zulip</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-url-input">URL Zulip</Label>
              <Input
                id="zulip-url-input"
                placeholder="https://yourzulip.zulipchat.com"
                value={notificationSettings.zulip.url}
                onChange={(e) => updateZulipSetting("url", e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-email-input">Email бота</Label>
              <Input
                id="zulip-email-input"
                placeholder="gitlab-bot@yourzulip.zulipchat.com"
                value={notificationSettings.zulip.email}
                onChange={(e) => updateZulipSetting("email", e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-api-key-input">API ключ</Label>
              <Input
                id="zulip-api-key-input"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={notificationSettings.zulip.apiKey}
                onChange={(e) => updateZulipSetting("apiKey", e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-stream-input">Поток</Label>
              <Input
                id="zulip-stream-input"
                placeholder="gitlab"
                value={notificationSettings.zulip.stream}
                onChange={(e) => updateZulipSetting("stream", e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-topic-input">Тема</Label>
              <Input
                id="zulip-topic-input"
                placeholder="GitLab Pipelines"
                value={notificationSettings.zulip.topic}
                onChange={(e) => updateZulipSetting("topic", e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="telegram-enabled-switch"
                checked={notificationSettings.telegram.enabled}
                onCheckedChange={(checked) => updateTelegramSetting("enabled", checked)}
              />
              <Label htmlFor="telegram-enabled-switch">Включить уведомления Telegram</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token-input">Токен бота</Label>
              <Input
                id="telegram-bot-token-input"
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={notificationSettings.telegram.botToken}
                onChange={(e) => updateTelegramSetting("botToken", e.target.value)}
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">Создайте бота с помощью @BotFather и получите токен</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id-input">ID чата</Label>
              <Input
                id="telegram-chat-id-input"
                placeholder="-1001234567890"
                value={notificationSettings.telegram.chatId}
                onChange={(e) => updateTelegramSetting("chatId", e.target.value)}
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Добавьте @RawDataBot в вашу группу, чтобы получить ID чата
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            <NotificationStatusSelector notifyOn={notificationSettings.notifyOn} onChange={updateNotificationStatus} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
