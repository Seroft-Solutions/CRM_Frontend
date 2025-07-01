"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { organizationToast, handleOrganizationError } from "./organization-toast";
import { organizationFormConfig } from "./form/organization-form-config";
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

import {
  useGetOrganization,
  useDeleteOrganization,
} from "@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen";



interface OrganizationDetailsProps {
  id: number;
}

export function OrganizationDetails({ id }: OrganizationDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get form config for step organization
  const formConfig = organizationFormConfig;

  // Fetch entity details
  const { data: entity, isLoading } = useGetOrganization(id, {
    query: {
      enabled: !!id,
    },
  });

  // Delete mutation
  const { mutate: deleteEntity } = useDeleteOrganization({
    mutation: {
      onSuccess: () => {
        organizationToast.deleted();
        router.push("/organizations");
      },
      onError: (error) => {
        handleOrganizationError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  // Render field value with simple, readable styling
  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (fieldConfig.type === 'boolean') {
      return (
        <span className="text-sm text-foreground">
          {value ? "Yes" : "No"}
        </span>
      );
    }
    
    if (fieldConfig.type === 'date') {
      return value ? (
        <span className="text-sm text-foreground">
          {format(new Date(value), "PPP")}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Not set</span>
      );
    }
    
    if (fieldConfig.type === 'file') {
      return value ? (
        <span className="text-sm text-foreground">File uploaded</span>
      ) : (
        <span className="text-sm text-muted-foreground">No file</span>
      );
    }
    
    if (fieldConfig.type === 'enum') {
      return value ? (
        <span className="text-sm text-foreground font-medium">{value}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Not set</span>
      );
    }
    
    // Default text/number fields
    return value ? (
      <span className="text-sm text-foreground">{value}</span>
    ) : (
      <span className="text-sm text-muted-foreground">Not set</span>
    );
  };

  // Render relationship value with simple styling
  const renderRelationshipValue = (relConfig: any, value: any) => {
    if (!value) {
      return (
        <span className="text-sm text-muted-foreground">
          {relConfig.multiple ? "None selected" : "Not selected"}
        </span>
      );
    }

    if (relConfig.multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <span className="text-sm text-muted-foreground">None selected</span>
        );
      }
      
      const displayValues = value.map((item: any) => item[relConfig.displayField] || item.id);
      return (
        <span className="text-sm text-foreground">
          {displayValues.join(", ")}
        </span>
      );
    } else {
      // Single relationship
      const displayValue = value[relConfig.displayField] || value.id;
      return (
        <span className="text-sm text-foreground font-medium">
          {displayValue}
        </span>
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
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  Step {index + 1} of {displaySteps.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Render Fields */}
                {step.fields.map(fieldName => {
                  const fieldConfig = formConfig.fields.find(f => f.name === fieldName);
                  if (!fieldConfig) return null;
                  
                  const value = entity[fieldName];
                  
                  return (
                    <div key={fieldName} className="space-y-1">
                      <span className="text-sm font-semibold text-foreground">{fieldConfig.label}:</span>
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
                      <span className="text-sm font-semibold text-foreground">{relConfig.ui.label}:</span>
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
            <Link href={`/organizations/${id}/edit`}>
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
              organization and remove its data from the server.
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