/**
 * Unauthorized Page Component
 * Displays when user lacks required permissions
 */

import Link from 'next/link';
import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UnauthorizedPageProps {
  title?: string;
  description?: string;
  requiredPermission?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export function UnauthorizedPage({
  title = 'Access Denied',
  description = "You don't have permission to access this resource.",
  requiredPermission,
  showBackButton = true,
  backUrl = '/',
}: UnauthorizedPageProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
          {requiredPermission && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Required permission:{' '}
                <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                  {requiredPermission}
                </code>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>If you believe this is an error, please contact your system administrator.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {showBackButton && (
              <Button variant="outline" className="flex-1" asChild>
                <Link href={backUrl}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Link>
              </Button>
            )}
            <Button className="flex-1" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
