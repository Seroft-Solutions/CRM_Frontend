"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { userAvailabilityToast, handleUserAvailabilityError } from "./user-availability-toast";
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
  useGetUserAvailability,
  useDeleteUserAvailability,
} from "@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen";



interface UserAvailabilityDetailsProps {
  id: number;
}

export function UserAvailabilityDetails({ id }: UserAvailabilityDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetUserAvailability(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteUserAvailability({
    mutation: {
      onSuccess: () => {
        userAvailabilityToast.deleted();
        router.push("/user-availabilities");
      },
      onError: (error) => {
        handleUserAvailabilityError(error);
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
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Day Of Week</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.dayOfWeek || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start Time</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.startTime || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End Time</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.endTime || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Is Available</dt>
                  <dd className="text-sm font-medium">
                    
                    <Badge variant={entity.isAvailable ? "default" : "secondary"} className="text-sm">
                      {entity.isAvailable ? "Yes" : "No"}
                    </Badge>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective From</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.effectiveFrom ? format(new Date(entity.effectiveFrom), "PPP") : "—"}
                    </span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Effective To</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.effectiveTo ? format(new Date(entity.effectiveTo), "PPP") : "—"}
                    </span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Zone</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.timeZone || "—"}</span>
                    
                  </dd>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>

        
        {/* Relationships */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
                Related Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</dt>
                  <dd className="text-sm font-medium">
                    
                    {entity.user ? (
                      <Badge variant="outline" className="text-sm font-medium">
                        {(entity.user as any).displayName || entity.user.id}
                      </Badge>
                    ) : "—"}
                    
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
            <Link href={`/user-availabilities/${id}/edit`}>
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
              useravailability and remove its data from the server.
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
