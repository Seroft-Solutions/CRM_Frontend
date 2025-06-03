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
  useGetCallStatus,
  useDeleteCallStatus,
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

interface CallStatusDetailsProps {
  id: number;
}

export function CallStatusDetails({ id }: CallStatusDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading, refetch } = useGetCallStatus(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteCallStatus({
    mutation: {
      onSuccess: () => {
        toast.success("CallStatus deleted successfully");
        router.push("/call-statuses");
      },
      onError: (error) => {
        toast.error(`Failed to delete CallStatus: ${error}`);
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
          <CardTitle className="text-2xl">CallStatus #id{entity.id}</CardTitle>
          <CardDescription>
            View details for this callstatus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.name || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.code || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.description || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.isFinal ? "Yes" : "No"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.isActive ? "Yes" : "No"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.sortOrder || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.remark || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.createdDate ? format(new Date(entity.createdDate), "PPP") : ""}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.lastModifiedDate ? format(new Date(entity.lastModifiedDate), "PPP") : ""}</p>

            </div>

          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/call-statuses">Back</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/call-statuses/${id}/edit`}>
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
              callstatus and remove its data from the server.
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
