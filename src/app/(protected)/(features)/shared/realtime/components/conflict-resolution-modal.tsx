'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Clock, User } from 'lucide-react'
import { format } from 'date-fns'

interface ConflictResolutionProps<T> {
  isOpen: boolean
  localData: T
  remoteData: T
  conflictedFields: string[]
  onResolve: (resolvedData: T, resolution: 'local' | 'remote' | 'merged') => void
  onCancel: () => void
  entityType?: string
  formatField?: (field: string, value: any) => string
}

export function ConflictResolutionModal<T extends Record<string, any>>({
  isOpen,
  localData,
  remoteData,
  conflictedFields,
  onResolve,
  onCancel,
  entityType = 'Record',
  formatField = (field, value) => String(value || 'Empty'),
}: ConflictResolutionProps<T>) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'custom'>('local')
  const [customData, setCustomData] = useState<T>({ ...localData })

  const handleResolve = () => {
    let resolvedData: T
    let resolutionType: 'local' | 'remote' | 'merged'

    switch (selectedResolution) {
      case 'local':
        resolvedData = localData
        resolutionType = 'local'
        break
      case 'remote':
        resolvedData = remoteData
        resolutionType = 'remote'
        break
      case 'custom':
        resolvedData = customData
        resolutionType = 'merged'
        break
      default:
        resolvedData = localData
        resolutionType = 'local'
    }

    onResolve(resolvedData, resolutionType)
  }

  const updateCustomField = (field: string, useLocal: boolean) => {
    const value = useLocal ? localData[field] : remoteData[field]
    setCustomData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Resolve {entityType} Conflict</span>
          </DialogTitle>
          <DialogDescription>
            Changes were made to this {entityType.toLowerCase()} by another user while you were editing.
            Please choose how to resolve the conflicts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resolution Strategy Selector */}
          <div className="flex space-x-2">
            <Button
              variant={selectedResolution === 'local' ? 'default' : 'outline'}
              onClick={() => setSelectedResolution('local')}
              className="flex-1"
            >
              Keep My Changes
            </Button>
            <Button
              variant={selectedResolution === 'remote' ? 'default' : 'outline'}
              onClick={() => setSelectedResolution('remote')}
              className="flex-1"
            >
              Use Their Changes
            </Button>
            <Button
              variant={selectedResolution === 'custom' ? 'default' : 'outline'}
              onClick={() => setSelectedResolution('custom')}
              className="flex-1"
            >
              Custom Merge
            </Button>
          </div>

          {/* Field Comparison */}
          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {conflictedFields.map((field) => (
                <Card key={field}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Local Version */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">Your Version</span>
                          <Badge variant="outline">Local</Badge>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-md border">
                          <p className="text-sm">{formatField(field, localData[field])}</p>
                        </div>
                        {selectedResolution === 'custom' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCustomField(field, true)}
                          >
                            Use This Value
                          </Button>
                        )}
                      </div>

                      {/* Remote Version */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Their Version</span>
                          <Badge variant="outline">Remote</Badge>
                        </div>
                        <div className="p-3 bg-green-50 rounded-md border">
                          <p className="text-sm">{formatField(field, remoteData[field])}</p>
                        </div>
                        {selectedResolution === 'custom' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCustomField(field, false)}
                          >
                            Use This Value
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Custom Merge Preview */}
                    {selectedResolution === 'custom' && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Merged Value</span>
                            <Badge variant="secondary">Custom</Badge>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm">{formatField(field, customData[field])}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Timestamp Information */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Last modified: {format(new Date(), 'PPpp')}</p>
            <p className="text-yellow-600">
              ⚠️ Resolving conflicts will overwrite the current server state
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>
            Apply Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}