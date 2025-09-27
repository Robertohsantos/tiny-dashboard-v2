'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useValidationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { FEATURE_FLAGS } from '@/modules/core/utils/feature-flags'
import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  RefreshCw,
  Shield,
  AlertCircle,
} from 'lucide-react'

export default function ValidationMonitorPage() {
  const report = useValidationTelemetry()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      window.location.reload()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const totalValidations = report.totalValidations || 1
  const errorPercentage = (report.errorRate * 100).toFixed(2)
  const successPercentage = (report.successRate * 100).toFixed(2)
  const fallbackPercentage = (report.fallbackRate * 100).toFixed(2)

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleExportMetrics = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `validation-metrics-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleForceRollback = () => {
    if (
      confirm(
        'Are you sure you want to force a rollback? This will disable validated hooks.',
      )
    ) {
      localStorage.setItem('feature-flag-validated-hooks', 'false')
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Validation Monitor</h1>
          <p className="text-muted-foreground">
            Real-time validation metrics and health status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMetrics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleForceRollback}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Force Rollback
          </Button>
        </div>
      </div>

      {report.health !== 'healthy' && (
        <Alert
          className={
            report.health === 'critical'
              ? 'border-red-500'
              : 'border-yellow-500'
          }
          variant="destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Health: {report.health.toUpperCase()}</AlertTitle>
          <AlertDescription>
            {report.health === 'critical'
              ? 'Critical error rate detected. Consider rolling back.'
              : 'Warning: Elevated error rate or slow validation times detected.'}
          </AlertDescription>
        </Alert>
      )}

      {report.rollbackTriggered && (
        <Alert className="border-red-500 mb-4" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>AUTO-ROLLBACK TRIGGERED</AlertTitle>
          <AlertDescription>
            Validation has been automatically disabled due to high error rates.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Validations
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValidations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Success: {report.validationSuccess} | Errors:{' '}
              {report.validationErrors}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successPercentage}%</div>
            <Progress value={parseFloat(successPercentage)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorPercentage}%</div>
            <Progress value={parseFloat(errorPercentage)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Validation Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.averageValidationTime.toFixed(2)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {report.p95ValidationTime}ms
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Error Contexts</CardTitle>
                <CardDescription>
                  Components with the most validation errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.topErrorContexts.map(([context, count]) => (
                    <div
                      key={context}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{context}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                  {report.topErrorContexts.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No errors detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Error Types</CardTitle>
                <CardDescription>
                  Most common validation error types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.topErrorTypes.map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-mono">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                  {report.topErrorTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No errors detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>P50 (Median)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.p50ValidationTime}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>P95</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.p95ValidationTime}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>P99</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.p99ValidationTime}ms
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Current feature flag configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Use Validated Hooks</Label>
                <Badge>
                  {FEATURE_FLAGS.USE_VALIDATED_HOOKS ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Validation Monitoring</Label>
                <Badge>
                  {FEATURE_FLAGS.VALIDATION_MONITORING ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Validation Fallback</Label>
                <Badge>
                  {FEATURE_FLAGS.VALIDATION_FALLBACK ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Debug Mode</Label>
                <Badge>
                  {FEATURE_FLAGS.VALIDATION_DEBUG ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Rollout Percentage</Label>
                <Badge>{FEATURE_FLAGS.VALIDATION_ROLLOUT_PERCENTAGE}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto Rollback</Label>
                <Badge>
                  {FEATURE_FLAGS.AUTO_ROLLBACK_ENABLED ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitor Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Auto Refresh (30s)</Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-debug">Show Debug Info</Label>
                <Switch
                  id="show-debug"
                  checked={showDebug}
                  onCheckedChange={setShowDebug}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Validation Errors</CardTitle>
              <CardDescription>Last 10 validation errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.recentErrors.map((error, index) => (
                  <div key={index} className="border rounded p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{error.context}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {error.errorTypes.map((type, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {error.errorCount} error
                      {error.errorCount !== 1 ? 's' : ''}
                    </p>
                    {showDebug && error.rawData != null && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.rawData, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {report.recentErrors.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recent errors
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
