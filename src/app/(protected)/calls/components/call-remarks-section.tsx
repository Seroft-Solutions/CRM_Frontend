"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  useGetAllCallRemarks,
  useCreateCallRemark,
  useUpdateCallRemark,
  useDeleteCallRemark,
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";
import type { CallRemarkDTO } from "@/core/api/generated/spring/schemas/CallRemarkDTO";

interface CallRemarksSectionProps {
  callId: number;
}

export function CallRemarksSection({ callId }: CallRemarksSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<CallRemarkDTO | null>(null);
  const [newRemark, setNewRemark] = useState("");
  const [editRemark, setEditRemark] = useState("");

  // Fetch call remarks for this specific call
  const { data: callRemarks = [], isLoading, refetch } = useGetAllCallRemarks(
    {
      'callId.equals': callId,
      sort: ["dateTime,desc"], // Most recent first
    },
    {
      query: {
        enabled: !!callId,
      },
    }
  );

  // Create mutation
  const { mutate: createCallRemark, isPending: isCreating } = useCreateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("Call remark added successfully");
        setShowAddDialog(false);
        setNewRemark("");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to add call remark: ${error}`);
      },
    },
  });

  // Update mutation
  const { mutate: updateCallRemark, isPending: isUpdating } = useUpdateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("Call remark updated successfully");
        setShowEditDialog(false);
        setSelectedRemark(null);
        setEditRemark("");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to update call remark: ${error}`);
      },
    },
  });

  // Delete mutation
  const { mutate: deleteCallRemark, isPending: isDeleting } = useDeleteCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("Call remark deleted successfully");
        setShowDeleteDialog(false);
        setSelectedRemark(null);
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to delete call remark: ${error}`);
      },
    },
  });

  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    createCallRemark({
      data: {
        remark: newRemark,
        dateTime: new Date(),
        call: { id: callId },
      },
    });
  };

  const handleEditRemark = () => {
    if (!selectedRemark || !editRemark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    updateCallRemark({
      id: selectedRemark.id!,
      data: {
        ...selectedRemark,
        remark: editRemark,
      },
    });
  };

  const handleDeleteRemark = () => {
    if (selectedRemark?.id) {
      deleteCallRemark({ id: selectedRemark.id });
    }
  };

  const openEditDialog = (remark: CallRemarkDTO) => {
    setSelectedRemark(remark);
    setEditRemark(remark.remark || "");
    setShowEditDialog(true);
  };

  const openDeleteDialog = (remark: CallRemarkDTO) => {
    setSelectedRemark(remark);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">
                Call Remarks
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {callRemarks.length}
              </Badge>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Remark
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading remarks...</div>
            </div>
          ) : callRemarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No remarks yet</div>
              <div className="text-xs text-muted-foreground">
                Add the first remark to start tracking call history
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {callRemarks.map((remark, index) => (
                <div key={remark.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <div className="text-xs text-muted-foreground">
                          {remark.dateTime 
                            ? format(new Date(remark.dateTime), "PPP 'at' p")
                            : "No date"
                          }
                        </div>
                      </div>
                      <div className="ml-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {remark.remark}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(remark)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(remark)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {index < callRemarks.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Remark Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Call Remark</DialogTitle>
            <DialogDescription>
              Add a new remark to track important information about this call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-remark">Remark</Label>
              <Textarea
                id="new-remark"
                placeholder="Enter your remark here..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewRemark("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRemark}
              disabled={isCreating || !newRemark.trim()}
            >
              {isCreating ? "Adding..." : "Add Remark"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Remark Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Call Remark</DialogTitle>
            <DialogDescription>
              Update the remark content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-remark">Remark</Label>
              <Textarea
                id="edit-remark"
                placeholder="Enter your remark here..."
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedRemark(null);
                setEditRemark("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditRemark}
              disabled={isUpdating || !editRemark.trim()}
            >
              {isUpdating ? "Updating..." : "Update Remark"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Remark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this remark? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedRemark(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRemark}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
