'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Pencil, Trash, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import EntityLayout from './entity-layout';

// This is a generic entity detail page template
// It should be customized for each entity type

interface EntityDetailPageProps<T> {
  // Entity metadata
  entityName: string;
  entityNamePlural: string;
  basePath: string;
  id: string | number;
  
  // API hooks
  useGetEntity: any;
  useDeleteEntity: any;
  
  // Display fields
  fields: Array<{
    name: string;
    label: string;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relationship';
    relationshipDisplayField?: string;
    render?: (value: any, entity: T) => React.ReactNode;
  }>;
  
  // Optional callbacks
  onDelete?: () => void;
}

export default function EntityDetailPage<T>({
  entityName,
  entityNamePlural,
  basePath,
  id,
  useGetEntity,
  useDeleteEntity,
  fields,
  onDelete
}: EntityDetailPageProps<T>) {
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Fetch entity data
  const { data: entity, isLoading } = useGetEntity(id);
  
  // Delete mutation
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteEntity({
    mutation: {
      onSuccess: () => {
        toast.success(`${entityName} deleted successfully`);
        
        if (onDelete) {
          onDelete();
        } else {
          router.push(basePath);
        }
      },
      onError: (error: any) => {
        toast.error(`Error deleting ${entityName}: ${error?.message || 'Unknown error'}`);
        console.error(error);
      }
    }
  });
  
  // Handle delete
  const handleDelete = () => {
    deleteEntity({ id });
    setConfirmDialogOpen(false);
  };
  
  // Format field value based on type
  const formatFieldValue = (field: any, entity: any) => {
    if (!entity) return null;
    
    // Use custom renderer if provided
    if (field.render) {
      return field.render(entity[field.name], entity);
    }
    
    const value = entity[field.name];
    
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">--</span>;
    }
    
    // Handle relationship fields
    if (field.type === 'relationship' && field.relationshipDisplayField) {
      if (!value) return <span className="text-muted-foreground">--</span>;
      
      if (Array.isArray(value)) {
        return value.map(item => item[field.relationshipDisplayField!] || `ID: ${item.id}`).join(', ');
      }
      
      return value[field.relationshipDisplayField] || `ID: ${value.id}`;
    }
    
    // Handle different field types
    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };
  
  return (
    <EntityLayout
      title={`${entityName} Details`}
      entityName={entityName}
      entityNamePlural={entityNamePlural}
      basePath={basePath}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${basePath}/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isDeleting}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : entity ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <Card key={field.name} className="overflow-hidden">
              <CardHeader className="bg-muted p-3">
                <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="break-words">
                  {formatFieldValue(field, entity)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data found for this {entityName.toLowerCase()}</p>
          <Button 
            variant="outline" 
            asChild 
            className="mt-4"
          >
            <Link href={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={confirmDialogOpen} 
        onOpenChange={setConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {entityName.toLowerCase()}
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EntityLayout>
  );
}
