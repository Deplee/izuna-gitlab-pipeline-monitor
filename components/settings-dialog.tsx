"use client"

import { useState, useEffect } from "react"
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
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
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

  const { toast } = useToast()

  // Load settings on open
  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const response = await fetch("/api/settings")
          if (response.ok) {
            const data = await response.json()
            setGitlabSettings(data.gitlab || gitlabSettings)
            setNotificationSettings(data.notifications || notificationSettings)
          }
        } catch (error) {
          console.error("Error fetching settings:", error)
        }
      }

      fetchSettings()
    }
  }, [open])

  const handleSaveSettings = async () => {
    try {
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
          title: "Settings saved",
          description: "Your settings have been saved successfully.",
        })
        onOpenChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your GitLab connection and notification preferences</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gitlab">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gitlab">GitLab</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="zulip">Zulip</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>

          <TabsContent value="gitlab" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gitlab-url">GitLab URL</Label>
              <Input
                id="gitlab-url"
                placeholder="https://gitlab.com"
                value={gitlabSettings.url}
                onChange={(e) => setGitlabSettings({ ...gitlabSettings, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-token">Personal Access Token</Label>
              <Input
                id="gitlab-token"
                type="password"
                placeholder="glpat-xxxxxxxxx"
                value={gitlabSettings.token}
                onChange={(e) => setGitlabSettings({ ...gitlabSettings, token: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Create a token with api scope at GitLab &gt; Settings &gt; Access Tokens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-repos">Repositories (Project IDs)</Label>
              <Input
                id="gitlab-repos"
                placeholder="123,456,789"
                value={gitlabSettings.repositories}
                onChange={(e) => setGitlabSettings({ ...gitlabSettings, repositories: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of GitLab project IDs to monitor</p>
            </div>
          </TabsContent>

          <TabsContent value="zulip" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="zulip-enabled"
                checked={notificationSettings.zulip.enabled}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, enabled: checked },
                  })
                }
              />
              <Label htmlFor="zulip-enabled">Enable Zulip Notifications</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-url">Zulip URL</Label>
              <Input
                id="zulip-url"
                placeholder="https://yourzulip.zulipchat.com"
                value={notificationSettings.zulip.url}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, url: e.target.value },
                  })
                }
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-email">Bot Email</Label>
              <Input
                id="zulip-email"
                placeholder="gitlab-bot@yourzulip.zulipchat.com"
                value={notificationSettings.zulip.email}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, email: e.target.value },
                  })
                }
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-api-key">API Key</Label>
              <Input
                id="zulip-api-key"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={notificationSettings.zulip.apiKey}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, apiKey: e.target.value },
                  })
                }
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-stream">Stream</Label>
              <Input
                id="zulip-stream"
                placeholder="gitlab"
                value={notificationSettings.zulip.stream}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, stream: e.target.value },
                  })
                }
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zulip-topic">Topic</Label>
              <Input
                id="zulip-topic"
                placeholder="GitLab Pipelines"
                value={notificationSettings.zulip.topic}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    zulip: { ...notificationSettings.zulip, topic: e.target.value },
                  })
                }
                disabled={!notificationSettings.zulip.enabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="telegram-enabled"
                checked={notificationSettings.telegram.enabled}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    telegram: { ...notificationSettings.telegram, enabled: checked },
                  })
                }
              />
              <Label htmlFor="telegram-enabled">Enable Telegram Notifications</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token">Bot Token</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={notificationSettings.telegram.botToken}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    telegram: { ...notificationSettings.telegram, botToken: e.target.value },
                  })
                }
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">Create a bot with @BotFather and get the token</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id">Chat ID</Label>
              <Input
                id="telegram-chat-id"
                placeholder="-1001234567890"
                value={notificationSettings.telegram.chatId}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    telegram: { ...notificationSettings.telegram, chatId: e.target.value },
                  })
                }
                disabled={!notificationSettings.telegram.enabled}
              />
              <p className="text-xs text-muted-foreground">Add @RawDataBot to your group to get the chat ID</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            <NotificationStatusSelector
              notifyOn={notificationSettings.notifyOn}
              onChange={(key, value) => {
                setNotificationSettings({
                  ...notificationSettings,
                  notifyOn: {
                    ...notificationSettings.notifyOn,
                    [key]: value,
                  },
                })
              }}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
