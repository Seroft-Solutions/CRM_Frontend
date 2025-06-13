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
import { CallRemarksSection } from "./call-remarks-section";

import {
  useGetCall,
  useDeleteCall,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";



interface CallDetailsProps {
  id: number;
}

export function CallDetails({ id }: CallDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading } = useGetCall(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteCall({
    mutation: {
      onSuccess: () => {
        toast.success("Call deleted successfully");
        router.push("/calls");
      },
      onError: (error) => {
        toast.error(`Failed to delete Call: ${error}`);
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
        {/* Step 1: Call Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
              🏷️ Call Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</dt>
                <dd className="text-sm font-medium">
                  {entity.priority ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.priority as any).name || entity.priority.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Type</dt>
                <dd className="text-sm font-medium">
                  {entity.callType ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.callType as any).name || entity.callType.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sub Call Type</dt>
                <dd className="text-sm font-medium">
                  {entity.subCallType ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.subCallType as any).name || entity.subCallType.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Category</dt>
                <dd className="text-sm font-medium">
                  {entity.callCategory ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.callCategory as any).name || entity.callCategory.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Source & Party */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
              🏢 Source & Party
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</dt>
                <dd className="text-sm font-medium">
                  {entity.source ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.source as any).name || entity.source.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party</dt>
                <dd className="text-sm font-medium">
                  {entity.party ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.party as any).name || entity.party.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
              📍 Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State</dt>
                <dd className="text-sm font-medium">
                  {entity.state ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.state as any).name || entity.state.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">District</dt>
                <dd className="text-sm font-medium">
                  {entity.district ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.district as any).name || entity.district.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City</dt>
                <dd className="text-sm font-medium">
                  {entity.city ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.city as any).name || entity.city.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Area</dt>
                <dd className="text-sm font-medium">
                  {entity.area ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.area as any).name || entity.area.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Channel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
              📡 Channel Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channel Type</dt>
                <dd className="text-sm font-medium">
                  {entity.channelType ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.channelType as any).name || entity.channelType.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channel Party</dt>
                <dd className="text-sm font-medium">
                  {entity.channelParty ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.channelParty as any).email || entity.channelParty.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 5: Assignment & Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground border-b pb-3">
              👤 Assignment & Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned To</dt>
                <dd className="text-sm font-medium">
                  {entity.assignedTo ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.assignedTo as any).email || entity.assignedTo.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Date Time</dt>
                <dd className="text-sm font-medium">
                  <span className="text-foreground">
                    {entity.callDateTime ? format(new Date(entity.callDateTime), "PPP") : "—"}
                  </span>
                </dd>
              </div>
              <div className="space-y-2">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Status</dt>
                <dd className="text-sm font-medium">
                  {entity.callStatus ? (
                    <Badge variant="outline" className="text-sm font-medium">
                      {(entity.callStatus as any).name || entity.callStatus.id}
                    </Badge>
                  ) : "—"}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Remarks Section */}
      <div className="mt-6">
        <CallRemarksSection callId={id} />
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/calls/${id}/edit`}>
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
              call and remove its data from the server.
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
