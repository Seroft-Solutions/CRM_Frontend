"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
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
  useGetDistrict,
  useDeleteDistrict,
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";



interface DistrictDetailsProps {
  id: number;
}

export function DistrictDetails({ id }: DistrictDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetDistrict(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteDistrict({
    mutation: {
      onSuccess: () => {
        toast.success("District deleted successfully");
        router.push("/districts");
      },
      onError: (error) => {
        toast.error(`Failed to delete District: ${error}`);
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
      <Card>
        <CardHeader>
          <CardDescription>
            Viewing details for District #id{entity.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-6 text-foreground border-b pb-2">Basic Information</h3>
                <div className="space-y-5">
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</dt>
                    <dd className="text-base font-medium">
                      
                      <span className="text-foreground break-words">{entity.name || "—"}</span>
                      
                    </dd>
                  </div>
                  
                </div>
              </div>
            </div>

            
            {/* Relationships */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-6 text-foreground border-b pb-2">Related Information</h3>
                <div className="space-y-5">
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">State</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.state ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.state as any).name || entity.state.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                </div>
              </div>
            </div>
            
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" asChild>
              <Link href={`/districts/${id}/edit`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              district and remove its data from the server.
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
