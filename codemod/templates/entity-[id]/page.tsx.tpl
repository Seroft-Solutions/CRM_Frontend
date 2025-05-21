'use client';

import { useState } from 'react';
import { [[hooks.find]] } from '[[endpointImport]]';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { [[dto]] } from '@/core/api/generated/schemas';

interface RelatedItem {
  id: number;
  [[#relationships]][[#isCollection]][[displayField]]: string;[[/isCollection]][[/relationships]]
}

interface Props {
  params: { 
    id: string;
  };
}

export default function View[[entity]]({ params }: Props) {
  const [notFound, setNotFound] = useState(false);
  
  // Use the find hook with correct parameters
  const { data, error, isLoading } = [[hooks.find]]({ 
    id: +params.id,
    onError: (err: any) => {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        toast.error(`Error loading [[entity]]: ${err.message}`);
      }
    }
  });

  if (notFound) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-muted-foreground">[[entity]] not found</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
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
          
          [[#relationships]]
          <div>
            <dt className="text-sm font-medium text-muted-foreground">[[label]]</dt>
            <dd className="mt-1 text-sm">
              {data.[[name]] ? (
                [[#isCollection]]
                <div className="flex flex-col gap-1">
                  {(data.[[name]] as RelatedItem[]).map((item) => (
                    <Link 
                      href={`/[[targetKebab]]/${item.id}`}
                      key={item.id}
                      className="hover:underline text-blue-600"
                    >
                      {item.[[displayField]] || item.id}
                    </Link>
                  ))}
                </div>
                [[/isCollection]]
                [[^isCollection]]
                <Link 
                  href={`/[[targetKebab]]/${(data.[[name]] as RelatedItem).id}`}
                  className="hover:underline text-blue-600"
                >
                  {(data.[[name]] as RelatedItem).[[displayField]] || 
                   (data.[[name]] as RelatedItem).id}
                </Link>
                [[/isCollection]]
              ) : 'N/A'}
            </dd>
          </div>
          [[/relationships]]
        </dl>
      </CardContent>
    </Card>
  );
}
