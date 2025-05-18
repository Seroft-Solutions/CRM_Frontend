/**
 * Entity Management Workflow Service
 * Provides workflow state management for entities
 */

import { BaseEntity } from '@/features/core/tanstack-query-api';

/**
 * Current workflow service version
 */
export const WORKFLOW_SERVICE_VERSION = '1.0.0';

/**
 * Workflow state interface
 */
export interface WorkflowState {
  id: string;
  name: string;
  color?: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
}

/**
 * Workflow transition interface
 */
export interface WorkflowTransition {
  id: string;
  name: string;
  fromState: string;
  toState: string;
  permission?: string;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

/**
 * Workflow configuration interface
 */
export interface WorkflowConfig<T extends BaseEntity = any> {
  entityType: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  stateField: keyof T;
  getAvailableTransitions?: (entity: T, userPermissions: string[]) => WorkflowTransition[];
  onTransition?: (entity: T, transition: WorkflowTransition) => Promise<void>;
}

/**
 * Workflow registry to manage different entity workflows
 */
class WorkflowRegistry {
  private workflows: Map<string, WorkflowConfig> = new Map();
  
  /**
   * Register a new workflow
   * 
   * @param config Workflow configuration
   */
  registerWorkflow<T extends BaseEntity>(config: WorkflowConfig<T>): void {
    this.workflows.set(config.entityType, config);
  }
  
  /**
   * Get workflow configuration by entity type
   * 
   * @param entityType Type of entity
   * @returns Workflow configuration
   */
  getWorkflow<T extends BaseEntity>(entityType: string): WorkflowConfig<T> | undefined {
    return this.workflows.get(entityType) as WorkflowConfig<T> | undefined;
  }
  
  /**
   * Check if workflow exists for entity type
   * 
   * @param entityType Type of entity
   * @returns Whether workflow exists
   */
  hasWorkflow(entityType: string): boolean {
    return this.workflows.has(entityType);
  }
  
  /**
   * Get all registered workflows
   * 
   * @returns List of registered workflow configurations
   */
  getAllWorkflows(): WorkflowConfig[] {
    return Array.from(this.workflows.values());
  }
}

/**
 * Global workflow registry instance
 */
export const workflowRegistry = new WorkflowRegistry();

/**
 * Get the current state of an entity
 * 
 * @param entity Entity to check
 * @param workflow Workflow configuration
 * @returns Current workflow state or undefined
 */
export function getEntityState<T extends BaseEntity>(
  entity: T,
  workflow: WorkflowConfig<T>
): WorkflowState | undefined {
  if (!entity) return undefined;
  
  const stateValue = entity[workflow.stateField] as string;
  return workflow.states.find(state => state.id === stateValue);
}

/**
 * Get available transitions for an entity
 * 
 * @param entity Entity to check
 * @param workflow Workflow configuration
 * @param userPermissions User permissions
 * @returns Available transitions
 */
export function getAvailableTransitions<T extends BaseEntity>(
  entity: T,
  workflow: WorkflowConfig<T>,
  userPermissions: string[] = []
): WorkflowTransition[] {
  if (!entity) return [];
  
  // Use custom function if provided
  if (workflow.getAvailableTransitions) {
    return workflow.getAvailableTransitions(entity, userPermissions);
  }
  
  // Default implementation
  const currentState = entity[workflow.stateField] as string;
  
  return workflow.transitions.filter(transition => {
    // Must match current state
    if (transition.fromState !== currentState) return false;
    
    // Check permission if required
    if (transition.permission && !userPermissions.includes(transition.permission)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Execute a workflow transition
 * 
 * @param entity Entity to transition
 * @param transition Transition to execute
 * @param workflow Workflow configuration
 * @returns Updated entity with new state
 */
export async function executeTransition<T extends BaseEntity>(
  entity: T,
  transition: WorkflowTransition,
  workflow: WorkflowConfig<T>
): Promise<T> {
  // Validate transition is applicable
  const currentState = entity[workflow.stateField] as string;
  if (transition.fromState !== currentState) {
    throw new Error(`Invalid transition: Entity is in state ${currentState}, transition requires ${transition.fromState}`);
  }
  
  // Create updated entity
  const updatedEntity = {
    ...entity,
    [workflow.stateField]: transition.toState
  };
  
  // Call custom hook if provided
  if (workflow.onTransition) {
    await workflow.onTransition(updatedEntity, transition);
  }
  
  return updatedEntity;
}

/**
 * Check if an entity can be edited based on its workflow state
 * 
 * @param entity Entity to check
 * @param workflow Workflow configuration
 * @returns Whether entity can be edited
 */
export function canEditEntity<T extends BaseEntity>(
  entity: T,
  workflow: WorkflowConfig<T>
): boolean {
  const state = getEntityState(entity, workflow);
  if (!state) return true; // If no state is found, default to allowing edit
  
  return state.allowEdit !== false; // Default to true if not specified
}

/**
 * Check if an entity can be deleted based on its workflow state
 * 
 * @param entity Entity to check
 * @param workflow Workflow configuration
 * @returns Whether entity can be deleted
 */
export function canDeleteEntity<T extends BaseEntity>(
  entity: T,
  workflow: WorkflowConfig<T>
): boolean {
  const state = getEntityState(entity, workflow);
  if (!state) return true; // If no state is found, default to allowing delete
  
  return state.allowDelete !== false; // Default to true if not specified
}
