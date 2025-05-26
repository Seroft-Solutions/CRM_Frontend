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
  useGetState,
  useDeleteState,
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";

interface StateDetailsProps {
  id: number;
}

export function StateDetails({ id }: StateDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entity details
  const { data: entity, isLoading, refetch } = useGetState(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteState({
    mutation: {
      onSuccess: () => {
        toast.success("State deleted successfully");
        router.push("/states");
      },
      onError: (error) => {
        toast.error(`Failed to delete State: ${error}`);
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
          <CardTitle className="text-2xl">State #id{entity.id}</CardTitle>
          <CardDescription>
            View details for this state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground"></p>

              <p>{entity.name || "—"}</p>

            </div>

          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/states">Back</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/states/${id}/edit`}>
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
              state and remove its data from the server.
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
