"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { meetingToast, handleMeetingError } from "./meeting-toast";
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
  useGetMeeting,
  useDeleteMeeting,
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";



interface MeetingDetailsProps {
  id: number;
}

export function MeetingDetails({ id }: MeetingDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetMeeting(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteMeeting({
    mutation: {
      onSuccess: () => {
        meetingToast.deleted();
        router.push("/meetings");
      },
      onError: (error) => {
        handleMeetingError(error);
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
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meeting Date Time</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.meetingDateTime ? format(new Date(entity.meetingDateTime), "PPP") : "—"}
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
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.title || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.description || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meeting Url</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.meetingUrl || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Google Calendar Event Id</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.googleCalendarEventId || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.notes || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Is Recurring</dt>
                  <dd className="text-sm font-medium">
                    
                    <Badge variant={entity.isRecurring ? "default" : "secondary"} className="text-sm">
                      {entity.isRecurring ? "Yes" : "No"}
                    </Badge>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Zone</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.timeZone || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meeting Status</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.meetingStatus || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meeting Type</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground break-words">{entity.meetingType || "—"}</span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created At</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.createdAt ? format(new Date(entity.createdAt), "PPP") : "—"}
                    </span>
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Updated At</dt>
                  <dd className="text-sm font-medium">
                    
                    <span className="text-foreground">
                      {entity.updatedAt ? format(new Date(entity.updatedAt), "PPP") : "—"}
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
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Organizer</dt>
                  <dd className="text-sm font-medium">
                    
                    {entity.organizer ? (
                      <Badge variant="outline" className="text-sm font-medium">
                        {(entity.organizer as any).email || entity.organizer.id}
                      </Badge>
                    ) : "—"}
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Party</dt>
                  <dd className="text-sm font-medium">
                    
                    {entity.assignedParty ? (
                      <Badge variant="outline" className="text-sm font-medium">
                        {(entity.assignedParty as any).name || entity.assignedParty.id}
                      </Badge>
                    ) : "—"}
                    
                  </dd>
                </div>
                
                <div className="space-y-2">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call</dt>
                  <dd className="text-sm font-medium">
                    
                    {entity.call ? (
                      <Badge variant="outline" className="text-sm font-medium">
                        {(entity.call as any).name || entity.call.id}
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
            <Link href={`/meetings/${id}/edit`}>
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
              meeting and remove its data from the server.
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
