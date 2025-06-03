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
  useGetCallRemark,
  useDeleteCallRemark,
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";

interface CallRemarkDetailsProps {
  id: number;
}

export function CallRemarkDetails({ id }: CallRemarkDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading, refetch } = useGetCallRemark(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("CallRemark deleted successfully");
        router.push("/call-remarks");
      },
      onError: (error) => {
        toast.error(`Failed to delete CallRemark: ${error}`);
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
          <CardTitle className="text-2xl">CallRemark #id{entity.id}</CardTitle>
          <CardDescription>
            View details for this callremark
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.remark || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.dateTime ? format(new Date(entity.dateTime), "PPP") : ""}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.isPrivate ? "Yes" : "No"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.remarkType || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.actionItems || "—"}</p>

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
              <p className="text-sm font-medium text-muted-foreground">Created By</p>

              <p>{(entity.createdBy as any)?.login || entity.createdBy?.id || "—"}</p>

            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Call</p>

              <p>{(entity.call as any)?.name || entity.call?.id || "—"}</p>

            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/call-remarks">Back</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/call-remarks/${id}/edit`}>
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
              callremark and remove its data from the server.
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
