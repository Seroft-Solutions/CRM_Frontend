'use client';

import { use[[entity]] } from '../context';
import { useEffect } from 'react';
import { [[hooks.find]] } from '[[endpointImport]]';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function View[[entity]]({ params }: { params: { id: string } }) {
  const { current: item, setItem, setLoading, setError } = use[[entity]]();
  const { data, error, isLoading } = [[hooks.find]]({ 
    id: +params.id,
    query: {
      onSuccess: (data) => setItem(data),
      onError: (err) => setError(err.message)
    }
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  if (error) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data && isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            [[#fields]]
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            [[/fields]]
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent>
          <div className="text-muted-foreground">[[entity]] not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>[[entity]] Details</CardTitle>
            <CardDescription>View [[entity]] information</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/[[kebab]]`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/[[kebab]]/${data.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          [[#fields]]
          <div>
            <dt className="text-sm font-medium text-muted-foreground">[[label]]</dt>
            <dd className="mt-1 text-sm">{data.[[name]] ?? 'N/A'}</dd>
          </div>
          [[/fields]]
        </dl>
      </CardContent>
    </Card>
  );
}
