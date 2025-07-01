"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { userProfileToast, handleUserProfileError } from "./user-profile-toast";
import { userProfileFormConfig } from "./form/user-profile-form-config";
import { Button } from "@/components/ui/button";
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
  useGetUserProfile,
  useDeleteUserProfile,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";



interface UserProfileDetailsProps {
  id: number;
}

export function UserProfileDetails({ id }: UserProfileDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get form config for step organization
  const formConfig = userProfileFormConfig;

  // Fetch entity details
  const { data: entity, isLoading } = useGetUserProfile(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteUserProfile({
    mutation: {
      onSuccess: () => {
        userProfileToast.deleted();
        router.push("/user-profiles");
      },
      onError: (error) => {
        handleUserProfileError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  // Render field value with consistent badge styling
  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (fieldConfig.type === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    
    if (fieldConfig.type === 'date') {
      return value ? (
        <Badge variant="secondary" className="text-xs">
          {format(new Date(value), "PPP")}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
      );
    }
    
    if (fieldConfig.type === 'file') {
      return value ? (
        <Badge variant="default" className="text-xs">File uploaded</Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground text-xs">No file</Badge>
      );
    }
    
    if (fieldConfig.type === 'enum') {
      return value ? (
        <Badge variant="default" className="text-xs font-medium">{value}</Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
      );
    }
    
    // Default text/number fields
    return value ? (
      <Badge variant="secondary" className="text-xs break-words">{value}</Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
    );
  };

  // Render relationship value with consistent badge styling
  const renderRelationshipValue = (relConfig: any, value: any) => {
    if (!value) {
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
          {relConfig.multiple ? "None selected" : "Not selected"}
        </Badge>
      );
    }

    if (relConfig.multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">None selected</Badge>
        );
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item[relConfig.displayField] || item.id}
            </Badge>
          ))}
        </div>
      );
    } else {
      // Single relationship
      const displayValue = value[relConfig.displayField] || value.id;
      return (
        <Badge variant="default" className="text-xs font-medium">
          {displayValue}
        </Badge>
      );
    }
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

  // Filter out review step and empty steps
  const displaySteps = formConfig.steps.filter(step => 
    step.id !== 'review' && 
    (step.fields.length > 0 || step.relationships.length > 0)
  );

  return (
    <>
      <div className="space-y-6">
        {displaySteps.map((step, index) => {
          const stepFields = [...step.fields, ...step.relationships];
          if (stepFields.length === 0) return null;

          return (
            <div key={step.id} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 text-sm">{step.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Render Fields */}
                {step.fields.map(fieldName => {
                  const fieldConfig = formConfig.fields.find(f => f.name === fieldName);
                  if (!fieldConfig) return null;
                  
                  const value = entity[fieldName];
                  
                  return (
                    <div key={fieldName} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">{fieldConfig.label}:</span>
                      <div>
                        {renderFieldValue(fieldConfig, value)}
                      </div>
                    </div>
                  );
                })}

                {/* Render Relationships */}
                {step.relationships.map(relationshipName => {
                  const relConfig = formConfig.relationships.find(r => r.name === relationshipName);
                  if (!relConfig) return null;
                  
                  const value = entity[relationshipName];
                  
                  return (
                    <div key={relationshipName} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">{relConfig.ui.label}:</span>
                      <div>
                        {renderRelationshipValue(relConfig, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/user-profiles/${id}/edit`}>
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
              userprofile and remove its data from the server.
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