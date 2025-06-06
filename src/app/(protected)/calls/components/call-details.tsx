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
      <Card>
        <CardHeader>
          <CardDescription>
            Viewing details for Call #id{entity.id}
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
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call Date Time</dt>
                    <dd className="text-base font-medium">
                      
                      <span className="text-foreground">
                        {entity.callDateTime ? format(new Date(entity.callDateTime), "PPP") : "—"}
                      </span>
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</dt>
                    <dd className="text-base font-medium">
                      
                      <span className="text-foreground break-words">{entity.status || "—"}</span>
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Is Active</dt>
                    <dd className="text-base font-medium">
                      
                      <Badge variant={entity.isActive ? "default" : "secondary"} className="text-sm">
                        {entity.isActive ? "Yes" : "No"}
                      </Badge>
                      
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
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assigned To</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.assignedTo ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.assignedTo as any).login || entity.assignedTo.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Channel Party</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.channelParty ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.channelParty as any).login || entity.channelParty.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Priority</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.priority ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.priority as any).name || entity.priority.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call Type</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.callType ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.callType as any).name || entity.callType.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sub Call Type</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.subCallType ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.subCallType as any).name || entity.subCallType.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Source</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.source ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.source as any).name || entity.source.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Area</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.area ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.area as any).name || entity.area.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Product</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.product ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.product as any).name || entity.product.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Channel Type</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.channelType ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.channelType as any).name || entity.channelType.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call Category</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.callCategory ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.callCategory as any).name || entity.callCategory.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call Status</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.callStatus ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.callStatus as any).name || entity.callStatus.id}
                        </Badge>
                      ) : "—"}
                      
                    </dd>
                  </div>
                  
                  <div className="border-l-4 border-primary/20 pl-4 py-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Party</dt>
                    <dd className="text-base font-medium">
                      
                      {entity.party ? (
                        <Badge variant="outline" className="text-sm font-medium">
                          {(entity.party as any).name || entity.party.id}
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
              <Link href={`/calls/${id}/edit`} className="flex items-center gap-2">
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
