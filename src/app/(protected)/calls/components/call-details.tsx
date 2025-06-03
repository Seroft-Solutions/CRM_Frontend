"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  const { data: entity, isLoading, refetch } = useGetCall(id, {
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
    return <div>Loading...</div>;
  }

  if (!entity) {
    return <div>Entity not found</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Call #id{entity.id}</CardTitle>
          <CardDescription>
            View details for this call
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.callDateTime ? format(new Date(entity.callDateTime), "PPP") : ""}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.direction || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.durationSeconds || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.outcome || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.expectedRevenue || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.actualRevenue || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.probability || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.nextFollowUpDate ? format(new Date(entity.nextFollowUpDate), "PPP") : ""}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.isCompleted ? "Yes" : "No"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.summary || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.recordingUrl || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.internalNotes || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.status || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.isActive ? "Yes" : "No"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.createdDate ? format(new Date(entity.createdDate), "PPP") : ""}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.lastModifiedDate ? format(new Date(entity.lastModifiedDate), "PPP") : ""}</p>

            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Assigned To</p>

              <p>{(entity.assignedTo as any)?.login || entity.assignedTo?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Channel Party</p>

              <p>{(entity.channelParty as any)?.login || entity.channelParty?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>

              <p>{(entity.createdBy as any)?.login || entity.createdBy?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Priority</p>

              <p>{(entity.priority as any)?.name || entity.priority?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Call Type</p>

              <p>{(entity.callType as any)?.name || entity.callType?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Sub Call Type</p>

              <p>{(entity.subCallType as any)?.name || entity.subCallType?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Source</p>

              <p>{(entity.source as any)?.name || entity.source?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Area</p>

              <p>{(entity.area as any)?.name || entity.area?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Product</p>

              <p>{(entity.product as any)?.name || entity.product?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Channel Type</p>

              <p>{(entity.channelType as any)?.name || entity.channelType?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Call Category</p>

              <p>{(entity.callCategory as any)?.name || entity.callCategory?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Call Status</p>

              <p>{(entity.callStatus as any)?.name || entity.callStatus?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Products</p>

              <p>
                {entity.products?.length
                  ? entity.products.map((item) => item.name).join(", ")
                  : "—"}
              </p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Party</p>

              <p>{(entity.party as any)?.name || entity.party?.id || "—"}</p>

            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/calls">Back</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/calls/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

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
