"use client";

import * as React from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";



interface RelationshipEditingConfig {
  [relationshipName: string]: boolean;
}

interface CallCategoryTableSettingsProps {
  relationshipConfig: RelationshipEditingConfig;
  onRelationshipConfigChange: (config: RelationshipEditingConfig) => void;
}

export function CallCategoryTableSettings({
  relationshipConfig,
  onRelationshipConfigChange,
}: CallCategoryTableSettingsProps) {
  const [open, setOpen] = React.useState(false);

  // Available relationships for configuration
  const availableRelationships = [
    
  ];

  // Handle relationship config change
  const handleRelationshipToggle = (relationshipName: string, enabled: boolean) => {
    const newConfig = {
      ...relationshipConfig,
      [relationshipName]: enabled,
    };
    onRelationshipConfigChange(newConfig);
  };

  // Enable all relationships
  const enableAll = () => {
    const newConfig: RelationshipEditingConfig = {};
    availableRelationships.forEach(rel => {
      newConfig[rel.name] = true;
    });
    onRelationshipConfigChange(newConfig);
  };

  // Disable all relationships
  const disableAll = () => {
    const newConfig: RelationshipEditingConfig = {};
    availableRelationships.forEach(rel => {
      newConfig[rel.name] = false;
    });
    onRelationshipConfigChange(newConfig);
  };

  // Get count of enabled relationships
  const enabledCount = availableRelationships.filter(
    rel => relationshipConfig[rel.name]
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Table Settings
          {enabledCount > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs">
              {enabledCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Table Settings</SheetTitle>
          <SheetDescription>
            Configure which relationship fields can be edited directly in the table.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Relationship Editing Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Relationship Editing</h3>
                <p className="text-sm text-muted-foreground">
                  Enable inline editing for relationship fields
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={enableAll}
                  disabled={enabledCount === availableRelationships.length}
                >
                  Enable All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disableAll}
                  disabled={enabledCount === 0}
                >
                  Disable All
                </Button>
              </div>
            </div>

            <Separator />

            {availableRelationships.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No editable relationships available for this entity.
              </div>
            ) : (
              <div className="space-y-4">
                {availableRelationships.map((relationship) => (
                  <div key={relationship.name} className="flex items-center justify-between space-x-2">
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`relationship-${relationship.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {relationship.displayName}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {relationship.description}
                      </p>
                    </div>
                    <Switch
                      id={`relationship-${relationship.name}`}
                      checked={Boolean(relationshipConfig[relationship.name])}
                      onCheckedChange={(enabled) =>
                        handleRelationshipToggle(relationship.name, enabled)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Settings Section */}
          <div className="space-y-4">
            <Separator />
            <div>
              <h3 className="text-sm font-medium">Additional Settings</h3>
              <p className="text-sm text-muted-foreground">
                More table configuration options will be available here.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t pt-4 mt-6">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              • Enabled relationships can be edited directly in table cells
            </div>
            <div>
              • Use bulk assignment to update multiple rows at once
            </div>
            <div>
              • Changes are saved automatically when you make selections
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
