"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { availableTimeSlotToast, handleAvailableTimeSlotError } from "./available-time-slot-toast";
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
  useGetAvailableTimeSlot,
  useDeleteAvailableTimeSlot,
} from "@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen";



interface AvailableTimeSlotDetailsProps {
  id: number;
}

export function AvailableTimeSlotDetails({ id }: AvailableTimeSlotDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetAvailableTimeSlot(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteAvailableTimeSlot({
    mutation: {
      onSuccess: () => {
        availableTimeSlotToast.deleted();
        router.push("/available-time-slots");
      },
      onError: (error) => {
        handleAvailableTimeSlotError(error);
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
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slot Date Time</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.slotDateTime ? format(new Date(entity.slotDateTime), "PPP") : "—"}
                    </span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.duration || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Is Booked</dt>
                  <dd className="text-sm font-medium">
                    
                    <Badge variant={entity.isBooked ? "default" : "secondary"} className="text-sm">
                      {entity.isBooked ? "Yes" : "No"}
                    </Badge>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Booked At</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.bookedAt ? format(new Date(entity.bookedAt), "PPP") : "—"}
                    </span>
                    
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
                        {(entity.user as any).email || entity.user.id}
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
            <Link href={`/available-time-slots/${id}/edit`}>
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
              availabletimeslot and remove its data from the server.
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
