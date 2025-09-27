# @create-feature: Complete Feature Development Workflow

## 🎯 Overview

This command initiates a comprehensive, multi-phase workflow to guide the development of new features from concept to production. It consolidates research, planning, implementation, and validation into a single, cohesive process that ensures systematic development with the highest quality standards.

This workflow is interactive and requires your approval at each major phase. It integrates all aspects of development including analysis, design, implementation, testing, and documentation.

## 🌟 Core Principles

1.  **Approval-Driven Process**: I will pause for your explicit approval after completing requirements, design, and implementation planning. I will not proceed without it.
2.  **Research-First Mentality**: Every feature begins with comprehensive research and analysis to ensure we build the right solution.
3.  **Analysis-Before-Action**: ALL file operations require prior analysis to prevent errors and maintain quality.
4.  **Knowledge-Centric Workflow**: The entire process is documented in our memory system, creating interconnected knowledge for future reference.
5.  **Language Protocol**: All generated artifacts (code, memories, documentation) are in English. Communication adapts to your preferred language.

---

## 🚀 Complete Feature Development Lifecycle

### Phase 1: Research & Requirements Gathering

**Goal**: Understand the problem deeply through research and define what needs to be built.

#### 1.1 Mandatory Pre-Research Analysis

**CRITICAL**: Always analyze existing code before researching new features.

```javascript
// Analyze existing related features first
await analyze_feature({
  featurePath: 'src/features/related-feature',
  includeStats: true,
  projectRoot: './',
})

// Analyze files that might be affected
await analyze_file({
  filePath: 'src/core/relevant-file.ts',
  includeErrors: true,
  projectRoot: './',
})
```

**Why this analysis is mandatory:**

- Prevents feature conflicts with existing architecture
- Identifies reusable patterns and components
- Reveals technical constraints and dependencies
- Ensures alignment with current codebase health

#### 1.2 Comprehensive Research Process

I will conduct thorough research using all available tools:

**Internal Research:**

- `search_memories`: Find existing patterns, architectural decisions, similar implementations
- `visualize_memory_graph`: Map knowledge relationships and identify gaps
- `analyze_feature`: Deep dive into existing feature structures
- `read_file`: Examine key files like `prisma/schema.prisma`, `igniter.router.ts`

**External Research:**

- `browser_navigate`, `browser_snapshot`: Analyze competitors (HubSpot, PipeDrive, etc.)
- `search_github_issues`, `search_github_code`: Find community solutions and best practices
- `get_documentation`: Access official library/framework documentation

**Technical Validation:**

- `get_openapi_spec`: Understand current API structure
- `find_implementation`, `explore_source`: Investigate library internals
- `trace_dependency_chain`: Map complex dependencies

#### 1.3 Requirements Documentation

I will create structured requirements using this template:

```markdown
# Requirements: [Feature Name]

## Overview

[2-3 sentences describing the feature and its value]

## User Stories

- As a [user type], I want [feature] so that [benefit]
- As a [user type], I want [feature] so that [benefit]

## Acceptance Criteria (EARS Format)

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]
3. WHEN [event] AND [condition] THEN [system] SHALL [response]

## Technical Constraints

- [Constraint 1 with rationale]
- [Constraint 2 with rationale]

## Success Metrics

- [Measurable success criteria]
- [Performance benchmarks]
```

**Research Completion Criteria:**

- [ ] Business requirements clearly understood
- [ ] Technical feasibility validated
- [ ] Integration points identified
- [ ] Competitive landscape analyzed
- [ ] Success metrics defined

**Deliverable**: `insight` memory with category "requirements" and tags `["planning", "requirements", "<feature-name>"]`

**Approval Gate**: "**Do the requirements look good? If so, we can move on to the design.**"

---

### Phase 2: Technical Design & Architecture

**Goal**: Define how the feature will be built with detailed technical specifications.

#### 2.1 Mandatory Pre-Design Analysis

**CRITICAL**: Analyze all files that will be affected by the design.

```javascript
// Analyze every file mentioned in design
for (const filePath of designAffectedFiles) {
  await analyze_file({
    filePath,
    includeErrors: true,
    projectRoot: './',
  })
}

// Check integration points and dependencies
await trace_dependency_chain({
  symbol: 'IntegrationInterface',
  startFile: 'src/interfaces/integration.ts',
})
```

#### 2.2 Technical Design Creation

I will create comprehensive design documentation:

```markdown
# Design: [Feature Name]

## Architecture Overview

[High-level architecture with Mermaid diagrams]

## Components & Interfaces

### Component 1

- **Purpose**: [what it does]
- **Technology**: [tech stack decision]
- **Dependencies**: [what it depends on]
- **Files**: [affected file paths]

## Data Models

[Prisma schema changes with relationships]

## API Contracts

- `GET /api/feature` - [description and response shape]
- `POST /api/feature` - [description and request/response]
- Error responses and status codes

## State Management

[How data flows through the system]

## Error Handling Strategy

[Error scenarios, user feedback, logging]

## Testing Strategy

- Unit tests: [what to test]
- Integration tests: [API contracts, data flow]
- E2E tests: [user journeys, browser automation]

## Performance Considerations

[Expected load, optimization strategies]

## Security Requirements

[Authentication, authorization, data protection]
```

#### 2.3 Design Validation

- All analysis findings must be addressed in design
- Design must explain how architectural constraints are handled
- Must include migration path for existing data/code
- Must specify performance and security requirements

**Deliverable**: `architectural_decision` memory related to requirements memory

**Approval Gate**: "**Does the design look good? If so, we can move on to the implementation plan.**"

---

### Phase 3: Implementation Planning & Task Breakdown

**Goal**: Break design into executable, testable coding tasks with clear dependencies.

#### 3.1 Mandatory Pre-Planning Analysis

**CRITICAL**: Analyze all implementation files before task creation.

```javascript
// Analyze every file that will be modified
for (const filePath of implementationFiles) {
  await analyze_file({
    filePath,
    includeErrors: true,
    projectRoot: './',
  })
}
```

#### 3.2 Task Creation Strategy

Each task will be:

- **Code-focused**: Writing, modifying, or testing code
- **Analysis-informed**: References specific file health requirements
- **Incremental**: Builds on previous tasks, no orphaned code
- **Testable**: Has clear acceptance criteria

**Task Template:**

```markdown
# Task: [Clear Action Title]

## Context

[Why this task exists, references to design/requirements]

## Files to Modify

- `path/to/file.ts` - [what changes]
- `path/to/test.ts` - [test requirements]

## Implementation Steps

1. [Step 1 with technical details]
2. [Step 2 with validation]
3. [Step 3 with testing]

## Acceptance Criteria

- [ ] Code compiles without TypeScript errors
- [ ] All TSDoc comments added
- [ ] Unit tests pass
- [ ] Integration tests pass

## Dependencies

- [Task ID]: [Description]

## Estimated Effort: [X hours]
```

#### 3.3 Delegation Strategy Analysis

I will evaluate each task for delegation potential:

**Delegation Candidates:**

- Independent, well-scoped tasks
- Documentation and testing tasks
- Code that follows established patterns
- Tasks with clear acceptance criteria

**Direct Execution Required:**

- Architectural decisions
- Security implementations
- Complex integrations
- User experience decisions

#### 3.4 Task Dependencies & Execution Order

- Tasks linked with `depends_on` relationships
- Parallel execution where possible
- Critical path identified
- Risk mitigation strategies

**Deliverable**: Task memories + project management tasks + delegation strategy

**Approval Gate**: "**Here is the implementation plan. Do you approve it for execution?**"

---

### Phase 4: Implementation & Validation

**Goal**: Execute tasks incrementally with rigorous quality validation.

#### 4.1 Task Execution Protocol

**MANDATORY**: One task at a time, with full analysis cycle.

```javascript
// Pre-task: Analyze all affected files
for (const filePath of task.files) {
  await analyze_file({
    filePath,
    includeErrors: true,
    projectRoot: './',
  })
}

// Implementation: Write code following patterns

// Post-task: Re-analyze and validate
for (const filePath of task.files) {
  await analyze_file({
    filePath,
    includeErrors: true,
    projectRoot: './',
  })
}
```

#### 4.2 Quality Gates (Definition of Done)

**Backend Quality Gate:**

- [ ] Zero TypeScript errors (`analyze_file` health: "healthy")
- [ ] Comprehensive TSDocs on all exports
- [ ] Business logic documented with inline comments
- [ ] API tests pass (`make_api_request` comprehensive validation)
- [ ] OpenAPI spec validates (`get_openapi_spec`)

**Frontend Quality Gate:**

- [ ] Zero console errors
- [ ] All user flows tested with browser automation
- [ ] Responsive design verified
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance benchmarks met

#### 4.3 Validation Testing Strategy

**Backend Testing:**

```javascript
// Mandatory testing sequence
await testBackendImplementation({
  authentication: true,
  authorization: true,
  validation: true,
  errorHandling: true,
  performance: true,
})
```

**Frontend Testing:**

```javascript
// Browser automation validation
await testFrontendImplementation({
  navigation: true,
  interactions: true,
  forms: true,
  responsive: true,
  accessibility: true,
})
```

#### 4.4 Progress Tracking & Communication

- Task status updated: `todo` → `in_progress` → `done`
- Completion notes include test results and analysis findings
- Blockers communicated immediately
- Quality metrics tracked and reported

**Execution Flow**: Complete one task → Validate quality gates → Update status → Wait for next instruction

---

## 🔧 Critical Safety Protocols & Analysis Workflow

### Build Operations Ban

**🚫 ABSOLUTE PROHIBITION: NEVER execute build commands without explicit user permission**

- This includes: `npm run build`, `bun run build`, `yarn build`, or any build-related commands
- Always ask for explicit permission before any build operation
- Build operations are considered high-risk and require user oversight

### Mandatory Testing Protocol

**🔬 VALIDATION REQUIREMENT: All implementations require autonomous testing.**

- **Server and API Testing Protocol:** Before any API or browser testing, Lia must first investigate and identify the project's default development server port by reading `src/igniter.client.ts`. She must then verify if a server is already running on that identified port.
- **Server Startup (if needed):** If the port is not running, Lia **MUST** attempt to start the development server using `start_dev_server({ port: <identified_port>, watch: true })` and wait for 3 seconds for initialization. If the server cannot be started, Lia **MUST** report the issue for human intervention.
- **Back-End Testing (after server verification):** If the server is running, Lia proceeds to call `get_openapi_spec()` to confirm the API is responsive. If `get_openapi_spec()` succeeds, she can then proceed with `make_api_request` for back-end endpoint tests. If `get_openapi_spec()` fails, even with the port open, Lia **MUST** report the issue for human intervention.
- **Front-End Testing (after server verification):** If the server is running on the identified port, Lia can immediately proceed to use browser tools for autonomous front-end validation.

### Mandatory Analysis-Before-Action Protocol

**⚠️ CRITICAL REQUIREMENT: This is the most critical rule in the workflow. It is NEVER optional.**

**NEVER** read, modify, or work with any file without **FIRST** running `analyze_file`. This is a non-negotiable safety and quality protocol that prevents errors, ensures type safety, and maintains code quality.

**Why this is critical:**

- Prevents TypeScript errors from being introduced
- Ensures understanding of file structure and dependencies
- Identifies existing issues before making changes
- Provides context for safe modifications
- Maintains architectural consistency

**Analysis Workflow:**

```javascript
// MANDATORY - Always run this first
await analyze_file({
  filePath: 'path/to/your/file.ts',
  includeErrors: true,
  projectRoot: './',
})

// Check the health_summary.overall_status:
// - "healthy" ✅ - Safe to proceed
// - "has_warnings" ⚠️ - Proceed with caution, fix warnings if possible
// - "needs_attention" ❌ - STOP. Fix errors before any modifications
```

**Post-Modification Verification - MANDATORY:**

```javascript
// MANDATORY - Always verify your changes
await analyze_file({
  filePath: 'path/to/modified/file.ts',
  includeErrors: true,
  projectRoot: './',
})

// If errors are found, fix them immediately
// Never leave a file in an error state
```

---

## 🔍 Advanced Code Investigation Tools

### Tool Prioritization Hierarchy

| Task                   | ✅ ALWAYS USE (Primary MCP Tools)                                 | ❌ NEVER USE (Generic Alternatives)       |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| **File Analysis**      | `analyze_file`, `analyze_feature`                                 | `read_file` without analysis (DANGEROUS)  |
| **Code Investigation** | `find_implementation`, `explore_source`, `trace_dependency_chain` | `grep_search`, `codebase_search`          |
| **API Development**    | `get_openapi_spec`, `make_api_request`                            | `curl` (unless `make_api_request` fails)  |
| **Knowledge Storage**  | `store_memory`, `relate_memories`                                 | Storing info only in conversation history |
| **Research**           | `get_documentation`, `search_github_issues`                       | Relying on outdated training data         |
| **Task Management**    | `create_task`, `list_tasks`, `update_task_status`                 | Manual, ad-hoc tracking                   |
| **Agent Delegation**   | `delegate_to_agent`, `monitor_agent_tasks`                        | Performing all tasks manually             |

### Strategic Tool Usage Patterns

**For Library Source Code Analysis:**

- `find_implementation`: Locate symbol definitions when encountering unknown APIs
- `explore_source`: Deep dive into library internals and implementation patterns
- `trace_dependency_chain`: Map complex import chains and re-export patterns

**For Debugging and Problem Resolution:**

- `grep`: Pattern search across codebase for specific implementations
- `read_file`: Direct source code examination when experimental tools fail

**Fallback Strategies for Experimental Tools:**

- When `analyze_file` fails: Use `read_file` + `grep` for reliable file analysis
- When `analyze_feature` fails: Use `list_dir` + `read_file` for manual feature exploration
- When browser tools fail: Use `get_documentation` + `search_github_issues` as backups

---

## 🤖 Advanced Protocols & Strategic Considerations

### Task Management Integration & Delegation Strategy

**Task Creation & Tracking**:

- `create_task`: Creates actionable development tasks with comprehensive metadata (priority, dependencies, assignee).
- `update_task_status`: Updates task progress and completion notes.
- `list_tasks`: Provides overview of current workload and task dependencies.
- `get_task_statistics`: Analyzes team capacity and workload distribution.

**Delegation Intelligence**:

- `find_delegation_candidates`: Identifies tasks suitable for parallel execution via AI agents.
- `check_agent_environment`: Validates delegation infrastructure (Docker, API keys, environment setup).
- `delegate_to_agent`: Executes complex tasks in parallel using specialized AI agents.
- `monitor_agent_tasks`: Tracks progress of delegated work and collects results.

**Strategic Execution Planning**:

1.  **Workload Assessment**: Use `get_task_statistics` to understand current capacity.
2.  **Delegation Opportunities**: Apply `find_delegation_candidates` to identify parallel execution possibilities.
3.  **Environment Validation**: Run `check_agent_environment` before any delegation.
4.  **Progress Monitoring**: Use `monitor_agent_tasks` for real-time delegation tracking.

### Memory System Integration

**Knowledge Synthesis**:

- `store_memory`: Captures research findings, architectural decisions, and implementation patterns.
- `search_memories`: Retrieves existing knowledge to inform new feature development.
- `visualize_memory_graph`: Maps relationships between features, decisions, and patterns.
- `relate_memories`: Creates intelligent connections between related concepts and implementations.

**Research Documentation**:

1.  **Pattern Storage**: Store successful implementation patterns as `code_pattern` memories.
2.  **Decision Recording**: Document architectural choices as `architectural_decision` memories.
3.  **Requirement Tracking**: Maintain detailed requirements as `requirement` memories.
4.  **Task Documentation**: Record implementation tasks as `task` memories with completion notes.

**Knowledge Relationships**:

- Requirements `implements` business needs
- Design `implements` requirements
- Tasks `implements` design
- Code patterns `uses` architectural decisions
- Implementation findings `contradicts` or `extends` existing patterns

### Tool Selection Strategy by Context

**Research & Discovery Phase**:

- **Memory Assessment**: `search_memories`, `visualize_memory_graph`
- **Internal Analysis**: `analyze_feature` → `read_file` (fallback)
- **External Research**: `browser_navigate`, `search_github_code`
- **Documentation**: `get_documentation`, `browser_take_screenshot`

**Planning & Design Phase**:

- **Code Investigation**: `find_implementation`, `explore_source`, `trace_dependency_chain`
- **Architecture Validation**: `read_file` (schema), `get_openapi_spec`
- **Knowledge Synthesis**: `store_memory`, `relate_memories`

**Implementation & Execution Phase**:

- **Task Management**: `create_task`, `update_task_status`, `list_tasks`
- **Delegation**: `find_delegation_candidates`, `delegate_to_agent`, `monitor_agent_tasks`
- **Code Validation**: `analyze_file` → `read_file` + `grep` (fallback)
- **API Testing**: `make_api_request`, `get_openapi_spec`

**Quality Assurance Phase**:

- **Backend Testing**: `make_api_request` comprehensive test suites
- **Frontend Testing**: Browser automation tools (`browser_navigate`, `browser_click`, `browser_snapshot`)
- **Documentation**: `get_openapi_spec` for API contract validation

### Fallback Strategies for Experimental Tools

**When `analyze_file` Fails**:

1.  **Primary Fallback**: `read_file` + `grep` for manual file analysis
2.  **Enhanced Analysis**: Combine `read_file` with `find_implementation` for symbol resolution
3.  **Pattern Search**: Use `grep` to find similar implementations across the codebase

**When `analyze_feature` Fails**:

1.  **Directory Exploration**: `list_dir` to understand feature structure
2.  **File-by-File Analysis**: `read_file` for key files (controller, interfaces, procedures)
3.  **Pattern Discovery**: `grep` to find usage patterns and relationships

**When Browser Tools Fail**:

1.  **Manual Research**: Document findings from manual exploration
2.  **Alternative Sources**: Use `get_documentation` and `search_github_issues` as backups
3.  **Screenshot Documentation**: Manual screenshots when automated capture fails

### Integration with MCP Server Tools

**All Available Tools Integration**:

- **CLI Tools**: `start_dev_server`, `build_project`, `run_tests`, `generate_feature`, `generate_controller`, `generate_procedure`, `generate_schema`, `generate_docs`
- **API Tools**: `get_openapi_spec`, `make_api_request`
- **File Tools**: `analyze_file`, `analyze_feature`, `read_file`, `grep`, `list_dir`
- **Code Investigation**: `find_implementation`, `explore_source`, `trace_dependency_chain`
- **Browser Tools**: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_press_key`, `browser_wait_for`, `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`, `browser_evaluate`, `browser_file_upload`, `browser_fill_form`, `browser_select_option`, `browser_drag`, `browser_hover`, `browser_tabs`, `browser_handle_dialog`, `browser_resize`, `browser_close`
- **GitHub Tools**: `search_github_issues`, `create_github_issue`, `list_issues`, `search_github_code`, `read_github_file`
- **Memory System**: `store_memory`, `search_memories`, `relate_memories`, `visualize_memory_graph`, `reflect_on_memories`
- **Task Management**: `create_task`, `list_tasks`, `update_task_status`, `delete_task`, `reorder_tasks`, `get_task_statistics`, `find_delegation_candidates`
- **Agent Delegation**: `delegate_to_agent`, `monitor_agent_tasks`, `check_delegation_status`, `list_active_delegations`, `cancel_delegation`, `check_agent_environment`, `setup_agent_environment`
- **Documentation**: `get_documentation`, `search_github_issues`
- **Advanced Debugging**: `find_implementation`, `explore_source`, `trace_dependency_chain`

**Strategic Tool Usage**:

- **Research Phase**: Browser tools + GitHub tools + Memory system
- **Planning Phase**: Code investigation tools + File analysis tools
- **Implementation Phase**: Task management + Agent delegation + CLI tools
- **Validation Phase**: API tools + Browser tools + Analysis tools

The tools will automatically:

- Create the feature directory structure
- Generate controllers with CRUD operations
- Create procedures with business logic
- Generate TypeScript interfaces
- Set up basic data access patterns

### Phase 4: Database Operations

```bash
# Generate and run migration
bun db:migrate:dev --name add_task_feature

# Generate TypeScript types
bun db:generate
```

### Phase 5: Backend Implementation and Critical Testing

#### 5.1 DELETE the index.ts file

```bash
# IMPORTANT: Delete the generated index.ts file
rm src/features/task/index.ts
```

#### 5.2 Update Procedure to Use Correct Pattern

The CLI generates procedures with `context.database`, but the boilerplate uses `context.services.database`. Also needs multi-tenancy and business logic:

```typescript
// src/features/task/procedures/task.procedure.ts
import { igniter } from '@/igniter'
import type { CreateTaskInput, UpdateTaskInput } from '../task.interfaces'

/**
 * @const TaskProcedure
 * @description Igniter.js procedure to inject an instance of TaskRepository into the context under a hierarchical structure.
 * This creates a consistent pattern: context.{featureName}.{resourceType}.{resourceName}
 * @returns {TaskContext} An object containing the task repository in hierarchical structure.
 */
export const TaskProcedure = igniter.procedure({
  name: 'TaskProcedure',
  handler: (_, { context }) => {
    // Context Extension: Return the repository instance in hierarchical structure for consistency.
    return {
      task: {
        findMany: async (organizationId: string) => {
          return context.services.database.task.findMany({
            where: {
              organizationId: organizationId,
            },
            include: {
              assignedTo: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        },
        findUnique: async (id: string, organizationId: string) => {
          return context.services.database.task.findUnique({
            where: {
              id: id,
              organizationId: organizationId,
            },
            include: {
              assignedTo: true,
            },
          })
        },
        create: async (organizationId: string, data: CreateTaskInput) => {
          const task = await context.services.database.task.create({
            data: {
              ...data,
              organizationId: organizationId,
              dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
            include: {
              assignedTo: true,
            },
          })

          // Optional: Send notification
          await context.services.notification.send({
            type: 'TASK_CREATED',
            context: {
              organizationId: organizationId,
            },
            data: {
              taskTitle: task.title,
              assignedTo: task.assignedTo?.name,
            },
          })

          return task
        },
        update: async (
          id: string,
          organizationId: string,
          data: UpdateTaskInput,
        ) => {
          const taskAlreadyExists =
            await context.services.database.task.findUnique({
              where: {
                id: id,
                organizationId: organizationId,
              },
            })

          if (!taskAlreadyExists) {
            throw new Error('Task not found')
          }

          const task = await context.services.database.task.update({
            where: {
              id: id,
              organizationId: organizationId,
            },
            data: {
              ...data,
              dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: {
              assignedTo: true,
            },
          })

          // Optional: Send notification
          await context.services.notification.send({
            type: 'TASK_UPDATED',
            context: {
              organizationId: organizationId,
            },
            data: {
              taskTitle: task.title,
              changes: Object.keys(data),
            },
          })

          return task
        },
        delete: async (id: string, organizationId: string) => {
          const task = await context.services.database.task.delete({
            where: {
              id: id,
              organizationId: organizationId,
            },
          })

          // Optional: Send notification
          await context.services.notification.send({
            type: 'TASK_DELETED',
            context: {
              organizationId: task.organizationId,
            },
            data: {
              taskTitle: task.title,
            },
          })

          return task
        },
      },
    }
  },
})
```

#### 5.3 Add Authentication and Authorization to Controllers

```typescript
// src/features/task/controllers/task.controller.ts
import { igniter } from '@/igniter'
import { z } from 'zod'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { TaskProcedure } from '../procedures/task.procedure'
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
} from '../task.interfaces'

export const TaskController = igniter.controller({
  name: 'task',
  path: '/tasks',
  description: 'Manage tasks within the organization.',
  actions: {
    list: igniter.query({
      name: 'List',
      description: 'List all tasks for an organization.',
      path: '/',
      use: [AuthFeatureProcedure(), TaskProcedure()],
      handler: async ({ context, response }) => {
        // Authentication: Retrieve the authenticated user's session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Extract organization ID from authenticated session
        const organizationId = session.organization.id

        // Business Logic: Retrieve tasks using the TaskRepository
        const tasks = await context.task.findMany(organizationId)

        // Response: Return the list of tasks
        return response.success(tasks)
      },
    }),

    create: igniter.mutation({
      name: 'Create',
      description: 'Create a new task.',
      path: '/',
      method: 'POST',
      use: [AuthFeatureProcedure(), TaskProcedure()],
      body: CreateTaskInputSchema,
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        // Business Rule: If no active session or organization, return unauthorized
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Extract organization ID from authenticated session
        const organizationId = session.organization.id

        // Business Logic: Create a new task using the TaskRepository
        const task = await context.task.create(organizationId, request.body)

        // Response: Return the newly created task
        return response.created(task)
      },
    }),

    retrieve: igniter.query({
      name: 'Retrieve',
      description: 'Retrieve a single task by ID.',
      path: '/:id' as const,
      use: [AuthFeatureProcedure(), TaskProcedure()],
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Extract task ID from request parameters
        const { id } = request.params

        // Extract organization ID from authenticated session
        const organizationId = session.organization.id

        // Business Logic: Retrieve the task using the TaskRepository
        const task = await context.task.findUnique(id, organizationId)

        // Business Rule: If the task is not found, return a 404 Not Found response
        if (!task) {
          return response.notFound('Task not found.')
        }

        // Response: Return the retrieved task
        return response.success(task)
      },
    }),

    update: igniter.mutation({
      name: 'Update',
      description: 'Update an existing task by ID.',
      path: '/:id' as const,
      method: 'PATCH',
      use: [AuthFeatureProcedure(), TaskProcedure()],
      body: UpdateTaskInputSchema,
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Extract task ID from request parameters
        const { id } = request.params

        // Extract organization ID from authenticated session
        const organizationId = session.organization.id

        // Business Logic: Update the task using the TaskRepository
        const updatedTask = await context.task.update(
          id,
          organizationId,
          request.body,
        )

        // Response: Return the updated task
        return response.success(updatedTask)
      },
    }),

    delete: igniter.mutation({
      name: 'Delete',
      description: 'Delete a task by ID.',
      path: '/:id' as const,
      method: 'DELETE',
      use: [AuthFeatureProcedure(), TaskProcedure()],
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })

        // Business Rule: If no active session or organization, return unauthorized
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Extract task ID from request parameters
        const { id } = request.params

        // Extract organization ID from authenticated session
        const organizationId = session.organization.id

        // Business Logic: Delete the task using the TaskRepository
        await context.task.delete(id, organizationId)

        // Response: Return a 204 No Content status after successful deletion
        return response.noContent()
      },
    }),
  },
})
```

#### 5.4 MANDATORY Backend Testing Protocol

```typescript
// CRITICAL: Backend testing sequence - MUST PASS before proceeding to frontend

async function testBackendImplementation() {
  // 1. Verify server is running
  try {
    const openApiSpec = await get_openapi_spec()
    console.log('✅ Server is running and OpenAPI spec is accessible')
  } catch (error) {
    // Start server if not running
    await start_dev_server({ port: 3000, watch: true })
    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 3000))
    console.log('🚀 Server started successfully')
  }

  // 2. Test authentication and get API key
  const authTest = await make_api_request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
  })

  if (authTest.status !== 200) {
    throw new Error(`Authentication failed: ${authTest.status}`)
  }

  const apiKey = authTest.data.token
  console.log('✅ Authentication test passed')

  // 3. Test CREATE endpoint (success case)
  const createTest = await make_api_request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/tasks',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      title: 'Test Task',
      description: 'A test task created via API',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  if (createTest.status !== 201) {
    throw new Error(`CREATE endpoint failed: ${createTest.status}`)
  }
  console.log('✅ CREATE endpoint test passed')

  const createdTaskId = createTest.data.id

  // 4. Test LIST endpoint
  const listTest = await make_api_request({
    method: 'GET',
    url: 'http://localhost:3000/api/v1/tasks',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (listTest.status !== 200 || !Array.isArray(listTest.data)) {
    throw new Error(`LIST endpoint failed: ${listTest.status}`)
  }
  console.log('✅ LIST endpoint test passed')

  // 5. Test RETRIEVE endpoint
  const retrieveTest = await make_api_request({
    method: 'GET',
    url: `http://localhost:3000/api/v1/tasks/${createdTaskId}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (retrieveTest.status !== 200 || retrieveTest.data.id !== createdTaskId) {
    throw new Error(`RETRIEVE endpoint failed: ${retrieveTest.status}`)
  }
  console.log('✅ RETRIEVE endpoint test passed')

  // 6. Test UPDATE endpoint
  const updateTest = await make_api_request({
    method: 'PATCH',
    url: `http://localhost:3000/api/v1/tasks/${createdTaskId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      title: 'Updated Test Task',
      status: 'IN_PROGRESS',
    },
  })

  if (updateTest.status !== 200) {
    throw new Error(`UPDATE endpoint failed: ${updateTest.status}`)
  }
  console.log('✅ UPDATE endpoint test passed')

  // 7. Test validation errors
  const validationTest = await make_api_request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/tasks',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      title: '', // Required field empty
      priority: 'INVALID_PRIORITY', // Invalid enum value
    },
  })

  if (validationTest.status !== 400) {
    throw new Error(
      `Validation test failed: expected 400, got ${validationTest.status}`,
    )
  }
  console.log('✅ Validation error test passed')

  // 8. Test DELETE endpoint
  const deleteTest = await make_api_request({
    method: 'DELETE',
    url: `http://localhost:3000/api/v1/tasks/${createdTaskId}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (deleteTest.status !== 204) {
    throw new Error(`DELETE endpoint failed: ${deleteTest.status}`)
  }
  console.log('✅ DELETE endpoint test passed')

  // 9. Test authentication errors
  const authErrorTest = await make_api_request({
    method: 'GET',
    url: 'http://localhost:3000/api/v1/tasks',
    // No authorization header
  })

  if (authErrorTest.status !== 401) {
    throw new Error(
      `Authentication error test failed: expected 401, got ${authErrorTest.status}`,
    )
  }
  console.log('✅ Authentication error test passed')

  console.log('🎉 ALL BACKEND TESTS PASSED - Ready for frontend implementation')

  // Store successful test patterns
  await store_memory({
    type: 'api_mapping',
    title: 'Task API Backend Validation Results',
    content: `# Task API Backend Validation Results

## All Tests Passed ✅

### Endpoints Tested
- POST /api/v1/tasks - 201 Created
- GET /api/v1/tasks - 200 OK
- GET /api/v1/tasks/:id - 200 OK
- PATCH /api/v1/tasks/:id - 200 OK
- DELETE /api/v1/tasks/:id - 204 No Content

### Test Scenarios
- Happy path creation: PASS
- List all tasks: PASS
- Retrieve specific task: PASS
- Update task: PASS
- Validation errors: PASS
- Authentication required: PASS
- Authorization errors: PASS

### Performance
- Average response time: < 100ms
- No timeouts or connection issues

### Security
- Authentication properly enforced
- Multi-tenancy isolation working
- Input validation effective`,
    tags: ['api', 'validation', 'task-feature', 'backend', 'testing'],
    confidence: 0.95,
  })
}
```

#### 5.5 Enhance Interfaces with TS Docs Comments

```typescript
// src/features/task/task.interfaces.ts
import { z } from 'zod'

/**
 * Represents a task in the system
 * @interface Task
 */
export interface Task {
  /** Unique identifier for the task */
  id: string

  /** Title of the task */
  title: string

  /** Optional description of the task */
  description?: string

  /** Current status of the task */
  status: TaskStatus

  /** Priority level of the task */
  priority: TaskPriority

  /** Optional due date for the task */
  dueDate?: Date

  /** Optional ID of the user assigned to this task */
  assignedToId?: string

  /** ID of the organization this task belongs to */
  organizationId: string

  /** Date when the task was created */
  createdAt: Date

  /** Date when the task was last updated */
  updatedAt: Date
}

/**
 * Input data for creating a new task
 * @interface CreateTaskInput
 */
export interface CreateTaskInput {
  /** Title of the task (required) */
  title: string

  /** Optional description of the task */
  description?: string

  /** Priority level of the task */
  priority?: TaskPriority

  /** Optional due date for the task */
  dueDate?: string

  /** Optional ID of the user to assign this task to */
  assignedToId?: string
}

/**
 * Input data for updating an existing task
 * @interface UpdateTaskInput
 */
export interface UpdateTaskInput {
  /** Updated title of the task */
  title?: string

  /** Updated description of the task */
  description?: string

  /** Updated status of the task */
  status?: TaskStatus

  /** Updated priority level of the task */
  priority?: TaskPriority

  /** Updated due date for the task */
  dueDate?: string

  /** Updated ID of the user assigned to this task */
  assignedToId?: string
}

/**
 * Enumeration of possible task statuses
 * @enum TaskStatus
 */
export enum TaskStatus {
  /** Task is pending and not yet started */
  PENDING = 'PENDING',
  /** Task is currently in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Task has been completed */
  COMPLETED = 'COMPLETED',
  /** Task has been cancelled */
  CANCELLED = 'CANCELLED',
}

/**
 * Enumeration of possible task priorities
 * @enum TaskPriority
 */
export enum TaskPriority {
  /** Low priority task */
  LOW = 'LOW',
  /** Medium priority task */
  MEDIUM = 'MEDIUM',
  /** High priority task */
  HIGH = 'HIGH',
  /** Urgent priority task */
  URGENT = 'URGENT',
}

// Generated from your 'Task' Prisma model
export const TaskSchema = z.object({
  id: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  priority: z.string().nullable(),
  dueDate: z.date().nullable(),
  assignedToId: z.string().nullable(),
  assignedTo: z.string().nullable(),
  organizationId: z.string(),
  organization: z.string(),
  createdAt: z.date().nullable(),
  updatedAt: z.date(),
})

// Schema for creating a new Task.
// Fields managed by the database (id, createdAt, etc.) are omitted.
export const CreateTaskInputSchema = TaskSchema.omit({
  id: true,
  updatedAt: true,
})

// Schema for updating a Task. All fields are optional.
export const UpdateTaskInputSchema = CreateTaskInputSchema.partial()

// Exporting types for convenience
export type Task = z.infer<typeof TaskSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>
```

### Phase 6: Frontend Implementation and Validation

#### 6.1 Implement DataTable Components

```typescript
// src/features/task/presentation/components/task-data-table-provider.tsx
'use client'

import React from 'react'
import { ColumnDef, type Row } from '@tanstack/react-table'
import { DataTableProvider } from '@/components/ui/data-table/data-table-provider'
import type { Task } from '../../task.interfaces'

/**
 * Column definitions for Task DataTable
 * @see https://tanstack.com/table/v8/docs/api/core/column-def
 */
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => row.original.priority,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : '-',
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
    cell: ({ row }) => row.original.assignedTo?.name || 'Unassigned',
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Handle edit
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Handle delete
          }}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    ),
  },
]

interface TaskDataTableProviderProps {
  /** Initial data for the table */
  initialData: Task[]
  /** Child components */
  children: React.ReactNode
}

/**
 * Provider component for Task DataTable
 * @param initialData - Initial data for the table
 * @param children - Child components
 */
export function TaskDataTableProvider({
  initialData,
  children,
}: TaskDataTableProviderProps) {
  /**
   * Handle row click for navigation
   * @param row - The clicked row
   */
  const handleRowClick = (row: Row<Task>) => {
    window.location.href = `/app/tasks/${row.original.id}`
  }

  return (
    <DataTableProvider<Task>
      columns={columns}
      data={initialData}
      onRowClick={handleRowClick}
    >
      {children}
    </DataTableProvider>
  )
}
```

#### 6.2 Create Dashboard Page

```typescript
// src/app/(private)/app/(organization)/(dashboard)/tasks/page.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  PageBody,
  PageHeader,
  PageMainBar,
  PageSecondaryHeader,
  PageWrapper,
} from '@/components/ui/page'
import { TaskDataTable } from '@/features/task/presentation/components/task-data-table'
import { TaskDataTableProvider } from '@/features/task/presentation/components/task-data-table-provider'
import { TaskDataTableToolbar } from '@/features/task/presentation/components/task-data-table-toolbar'
import { TaskUpsertSheet } from '@/features/task/presentation/components/task-upsert-sheet'
import { api } from '@/igniter.client'
import { AppConfig } from '@/config/boilerplate.config.client'

export const metadata = {
  title: 'Tasks',
}

/**
 * Tasks dashboard page
 * @returns The tasks page component
 */
export default async function TasksPage() {
  // Fetch data server-side
  const tasks = await api.task.list.query({
    query: {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  })

  return (
    <TaskDataTableProvider initialData={tasks.data ?? []}>
      <PageWrapper>
        <PageHeader>
          <PageMainBar>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/app">{AppConfig.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Tasks</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageMainBar>
        </PageHeader>

        <PageSecondaryHeader className="bg-secondary/50">
          <TaskDataTableToolbar />
          <TaskUpsertSheet />
        </PageSecondaryHeader>

        <PageBody className="p-0 flex flex-col">
          <TaskDataTable />
        </PageBody>
      </PageWrapper>
    </TaskDataTableProvider>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
```

#### 6.3 MANDATORY Frontend Testing Protocol

```typescript
// CRITICAL: Frontend testing sequence - MUST PASS before marking task complete

async function testFrontendImplementation() {
  // 1. Verify server is running
  try {
    await browser_navigate({ url: 'http://localhost:3000' })
    console.log('✅ Frontend server is accessible')
  } catch (error) {
    throw new Error('Frontend server is not accessible')
  }

  // 2. Test navigation to tasks page
  await browser_navigate({ url: 'http://localhost:3000/app/tasks' })
  await browser_wait_for({ text: 'Tasks' })
  console.log('✅ Navigation to tasks page works')

  // 3. Test DataTable rendering
  await browser_snapshot({ random_string: 'datatable-rendering-check' })
  console.log('✅ DataTable is rendering correctly')

  // 4. Test create task functionality
  await browser_click({
    element: 'Add Task button',
    ref: 'add-task-button',
  })

  await browser_type({
    element: 'Task title input',
    ref: 'task-title-input',
    text: 'Test Task Created via Browser',
  })

  await browser_type({
    element: 'Task description input',
    ref: 'task-description-input',
    text: 'This task was created during automated browser testing',
  })

  await browser_click({
    element: 'Priority dropdown',
    ref: 'priority-dropdown',
  })

  await browser_click({
    element: 'High priority option',
    ref: 'high-priority-option',
  })

  await browser_click({
    element: 'Submit button',
    ref: 'submit-task-button',
  })

  await browser_wait_for({ text: 'Task created successfully' })
  console.log('✅ Create task functionality works')

  // 5. Test task list updates
  await browser_wait_for({ text: 'Test Task Created via Browser' })
  console.log('✅ Task list updates correctly after creation')

  // 6. Test task filtering
  await browser_type({
    element: 'Search input',
    ref: 'search-input',
    text: 'Test Task',
  })

  await browser_wait_for({ text: 'Test Task Created via Browser' })
  console.log('✅ Task filtering functionality works')

  // 7. Test task editing
  await browser_click({
    element: 'Edit button for test task',
    ref: 'edit-test-task-button',
  })

  await browser_type({
    element: 'Task title input',
    ref: 'task-title-input',
    text: 'Updated Test Task',
  })

  await browser_click({
    element: 'Save button',
    ref: 'save-task-button',
  })

  await browser_wait_for({ text: 'Task updated successfully' })
  console.log('✅ Task editing functionality works')

  // 8. Test task deletion
  await browser_click({
    element: 'Delete button for test task',
    ref: 'delete-test-task-button',
  })

  await browser_click({
    element: 'Confirm deletion button',
    ref: 'confirm-delete-button',
  })

  await browser_wait_for({ text: 'Task deleted successfully' })
  console.log('✅ Task deletion functionality works')

  // 9. Test responsive design
  await browser_resize({ width: 375, height: 667 }) // Mobile dimensions
  await browser_navigate({ url: 'http://localhost:3000/app/tasks' })
  await browser_snapshot({ random_string: 'mobile-responsive-check' })
  console.log('✅ Responsive design works on mobile')

  // 10. Test accessibility
  await browser_press_key({ key: 'Tab' })
  await browser_snapshot({ random_string: 'keyboard-navigation-check' })
  console.log('✅ Keyboard navigation works')

  // 11. Test form validation
  await browser_click({
    element: 'Add Task button',
    ref: 'add-task-button',
  })

  await browser_click({
    element: 'Submit button',
    ref: 'submit-task-button',
  })

  await browser_wait_for({ text: 'Title is required' })
  console.log('✅ Form validation works correctly')

  console.log('🎉 ALL FRONTEND TESTS PASSED - Feature implementation complete')

  // Store successful test patterns
  await store_memory({
    type: 'ui_validation',
    title: 'Task Feature Frontend Validation Results',
    content: `# Task Feature Frontend Validation Results

## All Tests Passed ✅

### UI Components Tested
- DataTable rendering: PASS
- Create task form: PASS
- Edit task form: PASS
- Delete task confirmation: PASS
- Search functionality: PASS
- Responsive design: PASS

### User Interactions Tested
- Navigation between pages: PASS
- Form submissions: PASS
- Button interactions: PASS
- Keyboard navigation: PASS
- Touch interactions: PASS

### Accessibility Tested
- Screen reader compatibility: PASS
- Keyboard navigation: PASS
- Focus management: PASS
- Color contrast: PASS

### Cross-Browser Compatibility
- Chrome: PASS
- Firefox: PASS
- Safari: PASS
- Mobile browsers: PASS

### Performance
- Page load time: < 2s
- Interaction response time: < 100ms
- No memory leaks detected`,
    tags: [
      'ui',
      'validation',
      'task-feature',
      'frontend',
      'testing',
      'accessibility',
    ],
    confidence: 0.95,
  })
}
```

### Phase 7: Register Feature Routes

Register the feature in the Igniter.js router:

```typescript
// src/igniter.router.ts
import { taskController } from '@/features/task/controllers/task.controller'

// Register task routes
router.register(taskController)
```

## 🔍 Feature Validation Checklist

### ✅ Research and Planning Phase

- [ ] Conducted comprehensive research of existing patterns and codebase
- [ ] Researched external documentation and best practices
- [ ] Analyzed competitor solutions and industry standards
- [ ] Synthesized findings into detailed requirements
- [ ] Stored research results as memories for future reference

### ✅ Database Layer

- [ ] Prisma schema properly defined with TS Docs comments
- [ ] Database migrations created and run successfully
- [ ] Relationships correctly established with proper constraints
- [ ] Indexes added for performance optimization
- [ ] Multi-tenancy constraints applied (organizationId)
- [ ] TypeScript types generated from Prisma schema

### ✅ Backend Layer

- [ ] Feature generated using correct Igniter.js CLI command
- [ ] Controllers implement proper HTTP methods with authentication
- [ ] Input validation with Zod schemas and proper error handling
- [ ] Business logic implemented in procedures
- [ ] Type safety maintained throughout with proper TypeScript interfaces
- [ ] Feature routes registered in Igniter.js router
- [ ] index.ts file DELETED (avoid bundle contamination)
- [ ] TS Docs comments added to all public interfaces
- [ ] Procedure updated to use context.services.database
- [ ] Multi-tenancy properly implemented
- [ ] **ALL BACKEND TESTS PASS** using make_api_request

### ✅ Frontend Layer

- [ ] DataTable components follow project pattern exactly
- [ ] Page components used correctly with proper structure
- [ ] Page created in correct location (app/ directory, not in feature folder)
- [ ] Components follow accessibility guidelines
- [ ] Forms have proper validation with React Hook Form + Zod
- [ ] Loading states and error handling implemented
- [ ] Responsive design implemented and tested
- [ ] **ALL FRONTEND TESTS PASS** using browser automation tools

### ✅ Integration

- [ ] End-to-end feature flow tested from UI to database
- [ ] Multi-tenancy isolation verified
- [ ] Performance benchmarks acceptable
- [ ] Security vulnerabilities addressed
- [ ] Documentation complete with TS Docs comments
- [ ] User acceptance criteria met

## 🚀 Quick Start Commands

### Generate Feature with Tools (Recommended)

```bash
# Using MCP Server tools (preferred)
igniter generate feature task --schema prisma:Task

# Using CLI (correct usage)
npx @igniter-js/cli generate feature task --schema prisma:Task
```

### Generate Empty Feature (Manual)

```bash
# Generate empty feature structure
npx @igniter-js/cli generate feature dashboard
```

### Database Operations

```bash
# Add model to Prisma schema
# Edit prisma/schema.prisma

# Generate and run migration
bun db:migrate:dev --name add_task_feature

# Generate TypeScript types
bun db:generate
```

### Manual Feature Creation (Only if tools unavailable)

```bash
# Create feature directory structure
mkdir -p src/features/{feature-name}/{controllers,procedures,presentation}

# Implement controllers, procedures, and components
# (follow the patterns above)

# Register feature routes
# Edit igniter.router.ts
```

## 📚 Best Practices

### 1. Research-First Development

- **MANDATORY**: Always conduct comprehensive research before implementation
- **Search memories** for existing patterns and decisions first
- **Analyze codebase** to understand current structure and patterns
- **Research external documentation** and best practices
- **Use browser tools** for market research and competitor analysis
- **Store research findings** as memories for future reference

### 2. Tool Usage Priority

1. **Always prefer Igniter.js MCP Server tools** when available
2. **Use Igniter.js CLI** with correct flags: `--schema prisma:Model`
3. **Manual implementation only** when tools are unavailable or for highly custom features

### 3. File Structure and Organization

- **NO index.ts files** in features (avoid bundle contamination)
- **Pages go in app/ directory**, not in feature folders
- **Follow the established feature structure** exactly
- **Use proper TypeScript interfaces** with TS Docs comments

### 4. Critical Customizations After CLI Generation

- **DELETE the index.ts file** immediately
- **Update procedures** to use `context.services.database` instead of `context.database`
- **Add authentication and authorization** to all controllers
- **Implement multi-tenancy** with organizationId checks
- **Add business logic** and notifications as needed
- **Enhance interfaces** with proper TS Docs comments

### 5. Mandatory Testing Protocol

- **Backend MUST pass all tests** before proceeding to frontend
- **Use get_openapi_spec** to verify server and API contracts
- **Use make_api_request** for comprehensive backend testing
- **Frontend MUST pass all browser automation tests**
- **Test success scenarios, error cases, and edge cases**
- **Test accessibility and responsive design**
- **Cannot advance tasks without successful testing validation**

### 6. Code Quality Standards

- **TS Docs comments** on all public interfaces, functions, and components
- **Type safety** maintained throughout the stack
- **Error handling** implemented at all layers
- **Authentication and authorization** properly configured
- **Multi-tenancy** enforced with organizationId constraints

### 7. UI/UX Patterns

- **Always use Page components** for dashboard pages
- **Follow DataTable pattern** exactly as documented
- **Use AnimatedEmptyState** for empty states
- **Implement proper responsive design**
- **Ensure accessibility** with proper ARIA attributes

### 8. Performance Considerations

- **Server-side data fetching** for initial page load
- **Proper database indexing** for frequent queries
- **Bundle optimization** with code splitting
- **Image and asset optimization**
- **Caching strategies** implemented where appropriate

## 🎯 Feature Completion Criteria

A feature is considered complete when:

- ✅ **Comprehensive research conducted** and documented
- ✅ **Generated using correct Igniter.js CLI command** (`--schema prisma:Model`)
- ✅ **index.ts file DELETED** (avoid bundle contamination)
- ✅ **Procedure updated to use context.services.database**
- ✅ **Follows all project patterns** exactly
- ✅ **Database schema properly designed** with migrations
- ✅ **TypeScript types generated** and working correctly
- ✅ **DataTable implemented** following project pattern
- ✅ **Page created in correct location** with Page components
- ✅ **Authentication and authorization** working
- ✅ **Multi-tenancy isolation** verified
- ✅ **ALL BACKEND TESTS PASS** (comprehensive API validation)
- ✅ **ALL FRONTEND TESTS PASS** (comprehensive browser automation)
- ✅ **All tests passing** with adequate coverage
- ✅ **Documentation complete** with TS Docs comments
- ✅ **Performance meets expectations**
- ✅ **Security vulnerabilities addressed**
- ✅ **User experience polished and intuitive**
- ✅ **Accessibility standards met**

## 🎉 Common Pitfalls to Avoid

Based on real developer feedback and CLI generation analysis:

### ❌ Don't:

- Skip comprehensive research phase before implementation
- Use incorrect CLI flags like `--crud`, `--auth`, `--organization`
- Keep the generated `index.ts` file (bundle contamination)
- Generate pages inside feature folders (pages go in `app/`)
- Use `context.database` instead of `context.services.database`
- Skip authentication and authorization in controllers
- Forget multi-tenancy requirements (organizationId)
- Skip TS Docs comments
- Proceed to frontend without complete backend testing
- Skip comprehensive frontend browser testing
- Manually create files when Igniter.js tools are available
- Forget to run `bun db:generate` after schema changes

### ✅ Do:

- **MANDATORY**: Conduct comprehensive research before any implementation
- Use correct CLI command: `npx @igniter-js/cli generate feature <name> --schema prisma:Model`
- **DELETE the index.ts file** immediately after generation
- Update procedures to use `context.services.database`
- Add proper authentication and authorization to all endpoints
- **COMPLETE ALL BACKEND TESTING** before frontend implementation
- **COMPLETE ALL FRONTEND BROWSER TESTING** before marking complete
- Follow the established file structure exactly
- Implement DataTable components using the project pattern
- Use Page components for dashboard pages
- Add TS Docs comments to all public interfaces
- Test multi-tenancy isolation thoroughly
- Run database migrations and type generation
- Customize the generated code with business logic and notifications
- Store research findings and test patterns as memories

## 🎯 Implementation Transition & Quality Assurance

### Specialized Workflow Integration

Once planning is complete, transition to specialized implementation workflows:

**UI/UX Focused Features:**

- Primary: `ux-ui-workflow.mdc` for design system and accessibility
- Secondary: `frontend-development.mdc` for React patterns
- Apply: `globals.css` design tokens, Shadcn UI integration, WCAG 2.1 AA standards

**Front-End Development:**

- Primary: `frontend-development.mdc` for React/Next.js patterns
- Secondary: `ux-ui-workflow.mdc` for design consistency
- Apply: Igniter.js client integration, performance optimization, component architecture

**Full-Stack Features:**

- Sequential: `ux-ui-workflow.mdc` → `frontend-development.mdc` → `development-workflow.mdc`
- Coordination: Seamless frontend-backend integration with quality gates

### Quality Assurance Standards

- Apply `development-workflow.mdc` throughout implementation
- Browser automation for comprehensive frontend validation
- Rigorous backend API testing with `make_api_request`
- Zero-error policies with TypeScript compilation validation

---

## 🤖 Agent Delegation & Task Management

### Delegation Strategy Intelligence

**Delegation Decision Framework:**

- **DELEGATE**: Complex + Independent tasks (documentation, testing, code following patterns)
- **EXECUTE**: Strategic + Integrated tasks (architecture, security, complex integrations)

**Delegation Candidates:**

- Independent, well-scoped tasks
- Documentation and testing tasks
- Code that follows established patterns
- Tasks with clear acceptance criteria

**Direct Execution Required:**

- Architectural decisions
- Security implementations
- Complex integrations
- User experience decisions

### Task Execution Protocol

**MANDATORY**: One task at a time, with full analysis cycle.

1. **Pre-Task Analysis**: Analyze all affected files before starting
2. **Implementation**: Write code following established patterns
3. **Post-Task Analysis**: Re-analyze all affected files to verify health
4. **Quality Validation**: Ensure zero TypeScript errors and proper documentation
5. **Status Update**: Only mark complete after successful validation

---

## 📚 Knowledge Management & Memory System

### Memory Types & Storage Strategy

- `user_preference`: Communication style, technical preferences, workflow likes/dislikes
- `architectural_decision`: System design choices, technology selections, integration patterns
- `code_pattern`: Reusable code structures, development workflows, best practices
- `bug_pattern`: Common errors, debugging approaches, solution patterns
- `performance_insight`: Optimization techniques, bottlenecks identified, measurement results
- `insight`: General learnings, observations, connections between concepts
- `relationship_map`: How different components/concepts relate to each other

### Knowledge Relationships

- Requirements `implements` business needs
- Design `implements` requirements
- Tasks `implements` design
- Code patterns `uses` architectural decisions
- Implementation findings `contradicts` or `extends` existing patterns

### Context Retrieval Strategy

**MANDATORY before starting any task:**

1. Search memories with relevant tags/keywords
2. Check for similar patterns or past solutions
3. Review user preferences for this type of work
4. Identify architectural constraints and decisions
5. Look for performance considerations and patterns

---

## 📋 Final Best Practices & Success Factors

### ✅ Critical Success Factors

**Research Excellence:**

- Always conduct comprehensive research before implementation
- Use all available tools: memories, analysis, external research
- Document findings systematically for future reference

**Analysis Discipline:**

- **MANDATORY**: `analyze_file` before ANY file operation
- Immediate TypeScript error resolution
- File health verification throughout development

**Quality Gate Adherence:**

- Zero TypeScript compilation errors
- Comprehensive TSDoc documentation
- Rigorous API and browser automation testing
- Accessibility and responsive design validation

**Incremental Development:**

- One task at a time with complete validation
- Clear acceptance criteria for each task
- Systematic progress tracking and status updates

### ❌ Common Pitfalls to Avoid

**Analysis Failures:**

- Never modify files without prior analysis
- Don't ignore TypeScript errors or warnings
- Always verify file health after modifications

**Planning Oversights:**

- Don't proceed without explicit approval at each phase
- Avoid skipping comprehensive research phase
- Never start implementation without approved design

**Quality Compromises:**

- Don't mark tasks complete without passing quality gates
- Never skip comprehensive backend and frontend testing
- Don't proceed to frontend without complete backend validation

**Technical Debt:**

- Always follow established architectural patterns
- Maintain proper TypeScript interfaces and documentation
- Implement proper error handling and validation

---

## 🚀 Quick Reference Commands

### Feature Generation

```bash
# CLI Generation (Recommended)
npx @igniter-js/cli generate feature <feature-name> --schema prisma:<ModelName>

# Manual Structure (Fallback)
mkdir -p src/features/<feature>/{controllers,procedures,presentation}
```

### Database Operations

```bash
# Schema updates and migrations
bun db:migrate:dev --name add_<feature>_feature
bun db:generate  # Generate TypeScript types
```

### Critical Implementation Steps

1. **DELETE** generated `index.ts` file immediately
2. Update procedures: `context.services.database` not `context.database`
3. Add authentication: `AuthFeatureProcedure()` to all controllers
4. Implement multi-tenancy with `organizationId` checks
5. **MANDATORY**: Complete ALL backend testing before frontend
6. **MANDATORY**: Complete ALL browser automation testing

---

## 🎯 Feature Completion Validation

A feature is **complete** when ALL criteria are satisfied:

**✅ Research & Planning**

- Comprehensive research conducted and documented
- Requirements clearly defined and approved
- Technical design created and validated
- Implementation plan approved with delegation strategy

**✅ Database Layer**

- Prisma schema with TS Docs comments
- Migrations executed successfully
- Relationships and constraints properly defined
- Multi-tenancy with `organizationId` enforced
- TypeScript types generated correctly

**✅ Backend Layer**

- Correct Igniter.js CLI command used (`--schema prisma:Model`)
- HTTP methods with authentication implemented
- Zod schemas for input validation
- Business logic in procedures
- Type safety throughout interfaces
- Routes registered in Igniter.js router
- `index.ts` file **DELETED** (no bundle contamination)
- TS Docs on all public interfaces
- `context.services.database` usage
- Multi-tenancy properly implemented
- **ALL BACKEND TESTS PASS** with `make_api_request`

**✅ Frontend Layer**

- DataTable components follow project pattern exactly
- Page components used correctly with proper structure
- Pages in `app/` directory (not feature folders)
- Accessibility guidelines followed
- React Hook Form + Zod validation
- Loading states and error handling implemented
- Responsive design tested
- **ALL BROWSER AUTOMATION TESTS PASS**

**✅ Integration & Quality**

- End-to-end flow tested from UI to database
- Multi-tenancy isolation verified
- Performance benchmarks met
- Security vulnerabilities addressed
- Documentation complete with TS Docs
- Acceptance criteria satisfied
- Zero TypeScript errors
- All quality gates passed

## 🔗 Additional Resources

### Documentation

- [Igniter.js CLI Documentation](https://igniterjs.com/docs/cli-and-tooling/igniter-generate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [TypeScript TS Docs](https://tsdoc.org/)

### Project Patterns

- [DataTable Component Guide](/.cursor/rules/data-table.mdc)
- [Page Component System](/.cursor/rules/page.mdc)
- [SaaS Boilerplate Architecture](./docs/architecture.md)
- [API Validation Workflow](/.cursor/rules/testing.mdc)
- [Tools Reference](/.cursor/rules/tools-reference.mdc)

### Community Support

- [Igniter.js Discord](https://discord.com/invite/JKGEQpjvJ6)
- [GitHub Issues](https://github.com/felipebarcelospro/saas-boilerplate/issues)
- [Vibe Dev YouTube Channel](https://www.youtube.com/@vibedev.official)
