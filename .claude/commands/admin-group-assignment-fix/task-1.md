# admin-group-assignment-fix - Task 1

Execute task 1 for the admin-group-assignment-fix specification.

## Task Description
Create AdminGroupService class

## Code Reuse
**Leverage existing code**: src/core/api/generated/keycloak/index.ts, src/app/api/keycloak/groups/route.ts

## Requirements Reference
**Requirements**: 1.1, 2.1, 2.2, 3.4

## Usage
```
/admin-group-assignment-fix-task-1
```

## Instructions
This command executes a specific task from the admin-group-assignment-fix specification.

**Automatic Execution**: This command will automatically execute:
```
/spec-execute 1 admin-group-assignment-fix
```

**Process**:
1. Load the admin-group-assignment-fix specification context (requirements.md, design.md, tasks.md)
2. Execute task 1: "Create AdminGroupService class"
3. **Prioritize code reuse**: Use existing components and utilities identified above
4. Follow all implementation guidelines from the main /spec-execute command
5. Mark the task as complete in tasks.md
6. Stop and wait for user review

**Important**: This command follows the same rules as /spec-execute:
- Execute ONLY this specific task
- **Leverage existing code** whenever possible to avoid rebuilding functionality
- Mark task as complete by changing [ ] to [x] in tasks.md
- Stop after completion and wait for user approval
- Do not automatically proceed to the next task

## Next Steps
After task completion, you can:
- Review the implementation
- Run tests if applicable
- Execute the next task using /admin-group-assignment-fix-task-[next-id]
- Check overall progress with /spec-status admin-group-assignment-fix
