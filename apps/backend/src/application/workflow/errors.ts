export class WorkflowDefinitionNotFoundError extends Error {
  constructor() {
    super("Workflow definition not found");
  }
}
