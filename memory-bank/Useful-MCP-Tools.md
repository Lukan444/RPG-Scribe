# Useful MCP Tools for RPG Archivist Development

This document outlines the Model Context Protocol (MCP) tools that will be particularly useful during the development of the RPG Archivist application, specifically for the migration from Material UI to Mantine.

## Project References

- **Old Project Location**: `D:\AI Projects\RPG-Archivist-Web`
- **Old Project Documentation**: `D:\AI Projects\RPG-Archivist-Web\memory-bank`
- **New Project Location**: `D:\AI Projects\RPG-Archivist-Web2`

## Recommended MCP Tools

### 1. Context7

**Purpose**: Access up-to-date documentation for libraries and frameworks.

**How to Use**:
```
resolve-library-id_Context7
get-library-docs_Context7
```

**Use Cases**:
- Get detailed information about Mantine components
- Learn best practices for Mantine implementation
- Understand form handling with @mantine/form
- Research styling approaches with CSS modules

**Example**:
```
get-library-docs_Context7(
  context7CompatibleLibraryID: "/mantinedev/mantine",
  tokens: 5000,
  topic: "form handling and validation"
)
```

### 2. 21st Magic Component Builder

**Purpose**: Generate UI components based on descriptions.

**How to Use**:
```
21st_magic_component_builder_magic-mcp
21st_magic_component_inspiration_magic-mcp
21st_magic_component_refiner_magic-mcp
```

**Use Cases**:
- Generate complex UI components like data tables
- Create form layouts with proper validation
- Design responsive layouts
- Implement specialized components for the Mind Map or Timeline

**Example**:
```
21st_magic_component_builder_magic-mcp(
  message: "Create a character card component with avatar, name, class, and level",
  searchQuery: "character card component",
  absolutePathToCurrentFile: "D:/AI Projects/RPG-Archivist-Web2/src/components/characters/CharacterCard.tsx",
  absolutePathToProjectDirectory: "D:/AI Projects/RPG-Archivist-Web2",
  context: "Creating a character card component for the RPG Archivist application"
)
```

### 3. Gitingest MCP Server

**Purpose**: Access code from GitHub repositories.

**How to Use**:
```
git_summary_Gitingest_MCP_Server
git_tree_Gitingest_MCP_Server
git_files_Gitingest_MCP_Server
```

**Use Cases**:
- Examine Mantine example repositories
- Research implementation patterns for specific components
- Find solutions to common problems
- Study best practices from other projects

**Example**:
```
git_files_Gitingest_MCP_Server(
  owner: "mantinedev",
  repo: "mantine",
  file_paths: ["src/mantine-form/src/use-form.ts"]
)
```

### 4. Desktop Commander

**Purpose**: Perform file operations and execute commands.

**How to Use**:
```
read_file_Desktop_Commander
write_file_Desktop_Commander
list_directory_Desktop_Commander
search_code_Desktop_Commander
edit_block_Desktop_Commander
execute_command_Desktop_Commander
```

**Use Cases**:
- Examine existing code in the old project
- Create new files in the new project
- Search for specific patterns in the codebase
- Make targeted edits to files

**Example**:
```
search_code_Desktop_Commander(
  path: "D:/AI Projects/RPG-Archivist-Web",
  pattern: "import.*from.*@material-ui/core",
  filePattern: "*.tsx"
)
```

### 5. Think Tool Server

**Purpose**: Perform complex reasoning about development challenges.

**How to Use**:
```
think_Think_Tool_Server
```

**Use Cases**:
- Analyze complex migration patterns
- Design architecture for specific modules
- Reason through state management approaches
- Solve challenging implementation problems

**Example**:
```
think_Think_Tool_Server(
  thought: "How should we approach migrating the Mind Map visualization from Material UI to Mantine while preserving the Cytoscape.js integration?"
)
```

### 6. DeepResearch

**Purpose**: Research specific technical challenges.

**How to Use**:
```
initialize-research_DeepResearch
execute-research-step_DeepResearch
generate-report_DeepResearch
complete-research_DeepResearch
```

**Use Cases**:
- Research best practices for specific Mantine components
- Investigate performance optimization techniques
- Explore solutions for complex UI challenges
- Learn about integration patterns for third-party libraries

**Example**:
```
complete-research_DeepResearch(
  query: "Best practices for integrating Cytoscape.js with React and Mantine",
  depth: 3
)
```

### 7. Memory Tool

**Purpose**: Store and retrieve important information about the project.

**How to Use**:
```
add-memory_Memory_Tool
search-memories_Memory_Tool
```

**Use Cases**:
- Store important decisions and rationales
- Keep track of project structure and organization
- Remember complex implementation details
- Maintain context across development sessions

**Example**:
```
add-memory_Memory_Tool(
  content: "The Mind Map module uses Cytoscape.js for visualization and requires special styling integration with Mantine.",
  userId: "mem0-mcp-user"
)
```

### 8. Logo Search

**Purpose**: Find and integrate logos for various services and tools.

**How to Use**:
```
logo_search_magic-mcp
```

**Use Cases**:
- Add logos for RPG systems
- Include icons for social sharing
- Integrate service logos for authentication providers
- Add brand elements to the UI

**Example**:
```
logo_search_magic-mcp(
  queries: ["dungeons and dragons", "pathfinder rpg"],
  format: "SVG"
)
```

### 9. Puppeteer

**Purpose**: Automate browser interactions for testing and research.

**How to Use**:
```
puppeteer_navigate_Puppeteer
puppeteer_screenshot_Puppeteer
puppeteer_click_Puppeteer
```

**Use Cases**:
- Test application functionality
- Capture screenshots for comparison
- Research UI patterns on other websites
- Automate repetitive testing tasks

**Example**:
```
puppeteer_navigate_Puppeteer(
  url: "https://mantine.dev/core/button/"
)
```

### 10. Sequential Thinking

**Purpose**: Break down complex problems into manageable steps.

**How to Use**:
```
sequentialthinking_Program
```

**Use Cases**:
- Plan complex migration tasks
- Design architecture for modules
- Solve challenging implementation problems
- Create step-by-step development plans

**Example**:
```
sequentialthinking_Program(
  thought: "How to implement the AI Brain module with Mantine components",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 8
)
```

## Conclusion

These MCP tools provide a powerful set of capabilities for the development of the RPG Archivist application. By leveraging these tools effectively, we can streamline the migration process, ensure high-quality implementation, and create a modern, maintainable application with Mantine.

When facing specific challenges during development, refer back to this document to identify the most appropriate tool for the task at hand. The combination of these tools will help us navigate the complexities of the migration process and create a successful application.
