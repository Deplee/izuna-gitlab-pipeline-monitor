"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NotificationStatusSelectorProps {
  notifyOn: {
    success: boolean
    failed: boolean
    running: boolean
    pending: boolean
  }
  onChange: (key: string, value: boolean) => void
  disabled?: boolean
}

export function NotificationStatusSelector({ notifyOn, onChange, disabled = false }: NotificationStatusSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Notification Triggers</CardTitle>
        <CardDescription>Select which pipeline statuses will trigger notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="notify-success"
              checked={notifyOn.success}
              onCheckedChange={(checked) => onChange("success", checked)}
              disabled={disabled}
            />
            <Label htmlFor="notify-success" className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              Success
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="notify-failed"
              checked={notifyOn.failed}
              onCheckedChange={(checked) => onChange("failed", checked)}
              disabled={disabled}
            />
            <Label htmlFor="notify-failed" className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              Failed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="notify-running"
              checked={notifyOn.running}
              onCheckedChange={(checked) => onChange("running", checked)}
              disabled={disabled}
            />
            <Label htmlFor="notify-running" className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              Running
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="notify-pending"
              checked={notifyOn.pending}
              onCheckedChange={(checked) => onChange("pending", checked)}
              disabled={disabled}
            />
            <Label htmlFor="notify-pending" className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              Pending
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
