export const Role = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const IssueStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

export const IssuePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const IssueType = {
  BUG: 'BUG',
  FEATURE: 'FEATURE',
  TASK: 'TASK',
  IMPROVEMENT: 'IMPROVEMENT',
};

export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
};

// Valid status transitions matching backend FSM
export const VALID_STATUS_TRANSITIONS = {
  [IssueStatus.OPEN]: [IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
  [IssueStatus.IN_PROGRESS]: [IssueStatus.RESOLVED, IssueStatus.OPEN],
  [IssueStatus.RESOLVED]: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS],
  [IssueStatus.CLOSED]: [IssueStatus.OPEN], // Reopen via reopen endpoint
};
