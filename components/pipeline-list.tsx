"use client"

import { useState, memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Play, AlertTriangle, ExternalLink } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Pipeline } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface PipelineListProps {
  pipelines: Pipeline[]
  isLoading: boolean
}

export const PipelineList = memo(function PipelineList({ pipelines, isLoading }: PipelineListProps) {
  const [displayCount, setDisplayCount] = useState(10)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <Play className="h-5 w-5 text-blue-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Успешно</Badge>
      case "failed":
        return <Badge className="bg-red-500">Ошибка</Badge>
      case "running":
        return <Badge className="bg-blue-500">Выполняется</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">В ожидании</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пайплайны</CardTitle>
          <CardDescription>Загрузка данных о пайплайнах...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pipelines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пайплайны</CardTitle>
          <CardDescription>Пайплайны не найдены</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Пайплайны не соответствуют текущим фильтрам или отсутствуют в выбранных репозиториях.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пайплайны</CardTitle>
        <CardDescription>
          Показано {Math.min(displayCount, pipelines.length)} из {pipelines.length} пайплайнов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Статус</TableHead>
              <TableHead>Репозиторий</TableHead>
              <TableHead>Ветка</TableHead>
              <TableHead>Коммит</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipelines.slice(0, displayCount).map((pipeline) => (
              <TableRow key={pipeline.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pipeline.status)}
                    {getStatusBadge(pipeline.status)}
                  </div>
                </TableCell>
                <TableCell>{pipeline.repository.name}</TableCell>
                <TableCell>{pipeline.ref}</TableCell>
                <TableCell className="font-mono text-xs">{pipeline.sha.substring(0, 8)}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true })}</TableCell>
                <TableCell>{pipeline.duration ? `${pipeline.duration}s` : "N/A"}</TableCell>
                <TableCell>
                  <a
                    href={pipeline.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
                  >
                    Просмотр <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pipelines.length > displayCount && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Загрузить еще
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

