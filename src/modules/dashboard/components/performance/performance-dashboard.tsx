/**
 * Performance Dashboard Component
 * Visualizes Web Vitals metrics in a professional dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { usePerformance } from '@/modules/core/providers/performance-provider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  Layout,
  MousePointer,
  Server,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react'
import { WEB_VITALS_THRESHOLDS } from '@/modules/core/performance/web-vitals'
import type {
  ExtendedMetric,
  Rating,
} from '@/modules/core/performance/web-vitals'

/**
 * Metric card component
 */
function MetricCard({ metric }: { metric: ExtendedMetric | undefined }) {
  if (!metric) {
    return (
      <Card className="opacity-50">
        <CardHeader className="pb-2">
          <CardDescription>No data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">--</div>
        </CardContent>
      </Card>
    )
  }

  const icon = getMetricIcon(metric.name)
  const color = getRatingColor(metric.rating)
  const badgeVariant = getRatingBadgeVariant(metric.rating)
  const thresholdKey = hasThreshold(metric.name) ? metric.name : null
  const threshold = thresholdKey
    ? WEB_VITALS_THRESHOLDS[thresholdKey]
    : undefined

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            {icon}
            {metric.name}
          </CardDescription>
          <Badge variant={badgeVariant}>{metric.rating}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatMetricValue(metric.name, metric.value)}
          </div>
          {threshold && (
            <div className="space-y-1">
              <Progress
                value={getProgressValue(metric.name, metric.value)}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Good: ≤{formatMetricValue(metric.name, threshold.good)}
                </span>
                <span>
                  Poor: {'>'}
                  {formatMetricValue(metric.name, threshold.needsImprovement)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main performance dashboard component
 */
export function PerformanceDashboard() {
  const { metrics, report, generateReport, clearMetrics, isEnabled } =
    usePerformance()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Convert Map to array for easier manipulation
  const metricsArray = Array.from(metrics.values())

  // Auto-refresh report
  useEffect(() => {
    const interval = setInterval(() => {
      if (isEnabled) {
        generateReport()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [generateReport, isEnabled])

  const handleRefresh = async () => {
    setIsLoading(true)
    await generateReport()
    setIsLoading(false)
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all performance data?')) {
      await clearMetrics()
    }
  }

  const handleExport = () => {
    const data = {
      metrics: metricsArray,
      report,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring Disabled</CardTitle>
          <CardDescription>
            Performance monitoring is currently disabled for this session or
            route.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Performance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time Web Vitals monitoring and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                {report.summary.averageScore.toFixed(0)}
              </div>
              <Progress
                value={report.summary.averageScore}
                className="flex-1"
              />
              <Badge
                variant={getScoreBadgeVariant(report.summary.averageScore)}
              >
                {getScoreLabel(report.summary.averageScore)}
              </Badge>
            </div>
            {report.summary.worstMetric && (
              <p className="text-sm text-muted-foreground mt-2">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                {report.summary.worstMetric} needs attention
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Core Web Vitals</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard metric={metrics.get('LCP')} />
              <MetricCard metric={metrics.get('FID') || metrics.get('INP')} />
              <MetricCard metric={metrics.get('CLS')} />
            </div>
          </div>

          {/* Other Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Other Metrics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard metric={metrics.get('FCP')} />
              <MetricCard metric={metrics.get('TTFB')} />
              <MetricCard metric={metrics.get('INP')} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {metricsArray.map((metric) => (
            <Card key={metric.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{metric.name}</CardTitle>
                  <Badge variant={getRatingBadgeVariant(metric.rating)}>
                    {metric.rating}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Value</dt>
                    <dd className="font-medium">
                      {formatMetricValue(metric.name, metric.value)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Timestamp</dt>
                    <dd className="font-medium">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Page</dt>
                    <dd className="font-medium truncate" title={metric.url}>
                      {new URL(metric.url).pathname}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Connection</dt>
                    <dd className="font-medium">
                      {metric.connectionType || 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Viewport</dt>
                    <dd className="font-medium">
                      {metric.viewport.width}x{metric.viewport.height}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Device Memory</dt>
                    <dd className="font-medium">
                      {metric.deviceMemory
                        ? `${metric.deviceMemory}GB`
                        : 'Unknown'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Track performance trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.metrics
                  .slice(-10)
                  .reverse()
                  .map((metric, index) => (
                    <div key={metric.id} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{metric.name}</span>
                          <span className="text-sm">
                            {formatMetricValue(metric.name, metric.value)}
                          </span>
                          <Badge
                            variant={getRatingBadgeVariant(metric.rating)}
                            className="ml-auto"
                          >
                            {metric.rating}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const METRIC_NAMES = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'] as const
type MetricName = (typeof METRIC_NAMES)[number]

const metricIcons: Record<MetricName, ReactElement> = {
  LCP: <Layout className="h-4 w-4" />,
  FID: <MousePointer className="h-4 w-4" />,
  CLS: <Activity className="h-4 w-4" />,
  FCP: <Zap className="h-4 w-4" />,
  TTFB: <Server className="h-4 w-4" />,
  INP: <Clock className="h-4 w-4" />,
}

const hasThreshold = (
  name: string,
): name is keyof typeof WEB_VITALS_THRESHOLDS =>
  Object.prototype.hasOwnProperty.call(WEB_VITALS_THRESHOLDS, name)

// Helper functions
function getMetricIcon(name: string): ReactElement {
  if ((METRIC_NAMES as readonly string[]).includes(name)) {
    return metricIcons[name as MetricName]
  }

  return <Activity className="h-4 w-4" />
}

function getRatingColor(rating: Rating) {
  return rating === 'good'
    ? 'bg-green-500'
    : rating === 'needs-improvement'
      ? 'bg-yellow-500'
      : 'bg-red-500'
}

function getRatingBadgeVariant(
  rating: Rating,
): 'default' | 'secondary' | 'destructive' {
  return rating === 'good'
    ? 'default'
    : rating === 'needs-improvement'
      ? 'secondary'
      : 'destructive'
}

function getScoreBadgeVariant(
  score: number,
): 'default' | 'secondary' | 'destructive' {
  return score >= 90 ? 'default' : score >= 50 ? 'secondary' : 'destructive'
}

function getScoreLabel(score: number) {
  return score >= 90
    ? 'Excellent'
    : score >= 75
      ? 'Good'
      : score >= 50
        ? 'Needs Improvement'
        : 'Poor'
}

function formatMetricValue(name: string, value: number) {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

function getProgressValue(name: string, value: number) {
  if (!hasThreshold(name)) {
    return 0
  }

  const threshold = WEB_VITALS_THRESHOLDS[name]

  const max = threshold.needsImprovement * 1.5
  return Math.min(100, (value / max) * 100)
}
