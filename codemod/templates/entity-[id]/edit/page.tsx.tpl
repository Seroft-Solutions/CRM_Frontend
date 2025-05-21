'use client';

import { notFound } from 'next/navigation';
import { [[hooks.find]] } from '[[endpointImport]]';
import [[entity]]Form from '../../form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  params: { 
    id: string;
  };
}

export default function Edit[[entity]]({ params }: Props) {
  const { data, error, isLoading } = [[hooks.find]]({ 
    id: +params.id,
    onError: (err) => {
      if (err.status !== 404) {
        toast.error(`Error loading [[entity]]: ${err.message}`);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return notFound();
  }

  // Pass the complete entity data to the form component
  return <[[entity]]Form defaultValues={data} />;
}
