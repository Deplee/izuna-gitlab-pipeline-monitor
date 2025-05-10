"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Play, AlertTriangle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Pipeline } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface PipelineListProps {
  pipelines: Pipeline[]
  isLoading: boolean
}

export function PipelineList({ pipelines, isLoading }: PipelineListProps) {
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
        return <Badge className="bg-green-500">Success</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>Loading pipeline data...</CardDescription>
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
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>No pipelines found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No pipelines match your current filters or no pipelines are available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipelines</CardTitle>
        <CardDescription>
          Showing {Math.min(displayCount, pipelines.length)} of {pipelines.length} pipelines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
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
                    View <ExternalLink className="h-3 w-3" />
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
              Load more
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
