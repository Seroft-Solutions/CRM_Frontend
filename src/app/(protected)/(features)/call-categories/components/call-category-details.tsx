"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { callCategoryToast, handleCallCategoryError } from "./call-category-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import {
  useGetCallCategory,
  useDeleteCallCategory,
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";



interface CallCategoryDetailsProps {
  id: number;
}

export function CallCategoryDetails({ id }: CallCategoryDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetCallCategory(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteCallCategory({
    mutation: {
      onSuccess: () => {
        callCategoryToast.deleted();
        router.push("/call-categories");
      },
      onError: (error) => {
        handleCallCategoryError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Entity not found</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-1 xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.name || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.description || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remark</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.remark || "—"}</span>
                    
                  </dd>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>

        
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/call-categories/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 justify-center"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              callcategory and remove its data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
