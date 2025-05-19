'use client';

import { use[[entity]] } from '../context';
import [[entity]]Form from '../form';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Create[[entity]]() {
  const { setSuccess, setError } = use[[entity]]();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create [[entity]]</CardTitle>
            <CardDescription>Add a new [[entity]] to the system</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/[[kebab]]`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <[[entity]]Form />
      </CardContent>
    </Card>
  );
}
