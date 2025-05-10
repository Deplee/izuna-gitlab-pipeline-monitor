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
  const { toast } = useToast()

  // Load settings on open
  useEffect(() => {
    let isMounted = true
    
    if (open && !settingsLoaded) {
      const fetchSettings = async () => {
        try {
          const response = await fetch("/api/settings")
          if (response.ok && isMounted) {
            const data = await response.json()
            
            setGitlabSettings(prevSettings => ({
              ...prevSettings,
              ...(data.gitlab || {})
            }))
            
            setNotificationSettings(prevSettings => ({
              ...prevSettings,
              ...(data.notifications || {})
            }))
            
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
    }
    
    return () => {
      isMounted = false
    }
  }, [open, toast])

  // Reset loaded state when dialog closes
  useEffect(() => {
    if (!open) {
      setSettingsLoaded(false)
    }
  }, [open])

  const handleSaveSettings = useCallback(async () => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!gitlabSettings.url) {
        toast({
          title: "Ошибка",
          description: "URL GitLab обязателен для заполнения",
          variant: "destructive",
        })
        return
      }

      if (!gitlabSettings.token) {
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
        throw new Error(error.message || "Не удалось сохранить настройки")
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
  }, [gitlabSettings, notificationSettings, toast, onOpenChange, onSettingsSaved])

  // Handle GitLab settings changes
  const updateGitlabSetting = useCallback((key: keyof GitLabSettings, value: string) => {
    setGitlabSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // Handle Zulip settings changes
  const updateZulipSetting = useCallback((key: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      zulip: {
        ...prev.zulip,
        [key]: value
      }
    }))
  }, [])

  // Handle Telegram settings changes
  const updateTelegramSetting = useCallback((key: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      telegram: {
        ...prev.telegram,
        [key]: value
      }
    }))
  }, [])

  // Handle notification status changes
  const updateNotificationStatus = useCallback((key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      notifyOn: {
        ...prev.notifyOn,
        [key]: value
      }
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
            <div className="space-y-2">
              <Label htmlFor="gitlab-url">URL GitLab</Label>
              <Input
                id="gitlab-url"
                placeholder="https://gitlab.com"
                value={gitlabSettings.url}
                onChange={(e) => updateGitlabSetting('url', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-token">Персональный токен доступа</Label>
              <Input
                id="gitlab-token"
                type="password"
                placeholder="glpat-xxxxxxxxx"
                value={gitlabSettings.token}
                onChange={(e) => updateGitlabSetting('token', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Создайте токен с правами api в GitLab &gt; Settings &gt; Access Tokens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-repos">Репозитории (ID проектов)</Label>
              <Input
                id="gitlab-repos"
                placeholder="123,456,789"
                value={gitlabSettings.repositories}
                onChange={(e) => updateGitlabSetting('repositories', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Список ID проектов GitLab для мониторинга, разделенных запятыми
              </p>
            </div>
          </TabsContent>

          <TabsContent value="zulip" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="zulip-enabled"
                checked={notificationSettings.zulip.enabled}
                onCheckedChange={(checked) => updateZulipSetting('enabled', checked)}
              />
              <Label htmlFor="zulip-enabled">Включить уведомления Zulip</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-url">URL Zulip</Label>
              <Input
                id="zulip-url"
                placeholder="https://yourzulip.zulipchat.com"
                value={notificationSettings.zulip.url}
                onChange={(e) => updateZulipSetting('url', e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-email">Email бота</Label>
              <Input
                id="zulip-email"
                placeholder="gitlab-bot@yourzulip.zulipchat.com"
                value={notificationSettings.zulip.email}
                onChange={(e) => updateZulipSetting('email', e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-api-key">API ключ</Label>
              <Input
                id="zulip-api-key"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={notificationSettings.zulip.apiKey}
                onChange={(e) => updateZulipSetting('apiKey', e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-stream">Поток</Label>
              <Input
                id="zulip-stream"
                placeholder="gitlab"
                value={notificationSettings.zulip.stream}
                onChange={(e) => updateZulipSetting('stream', e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-topic">Тема</Label>
              <Input
                id="zulip-topic"
                placeholder="GitLab Pipelines"
                value={notificationSettings.zulip.topic}
                onChange={(e) => updateZulipSetting('topic', e.target.value)}
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="telegram-enabled"
                checked={notificationSettings.telegram.enabled}
                onCheckedChange={(checked) => updateTelegramSetting('enabled', checked)}
              />
              <Label htmlFor="telegram-enabled">Включить уведомления Telegram</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token">Токен бота</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={notificationSettings.telegram.botToken}
                onChange={(e) => updateTelegramSetting('botToken', e.target.value)}
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">Создайте бота с помощью @BotFather и получите токен</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id">ID чата</Label>
              <Input
                id="telegram-chat-id"
                placeholder="-1001234567890"
                value={notificationSettings.telegram.chatId}
                onChange={(e) => updateTelegramSetting('chatId', e.target.value)}
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Добавьте @RawDataBot в вашу группу, чтобы получить ID чата
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            <NotificationStatusSelector
              notifyOn={notificationSettings.notifyOn}
              onChange={updateNotificationStatus}
            />
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
