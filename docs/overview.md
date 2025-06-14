# Junie Explorer - User Guide

Junie Explorer is a web application that provides an intuitive interface to browse and explore JetBrains IDE projects, issues, tasks, and development workflows. It automatically scans your JetBrains cache directory to discover all your IDE installations and their associated projects.

## Getting Started

Once you have Junie Explorer running (see [README.md](../README.md) for installation instructions), open your web browser and navigate to `http://localhost:3000` to access the application.

## Main Features

### 1. Homepage - Project Discovery and Overview

The homepage is your starting point for exploring all JetBrains projects across different IDEs on your system.

#### Project List View
![Homepage Project List](images/Homepage%20Project%20List.png)

The homepage displays:
- **IDE Filter**: Filter projects by specific JetBrains IDEs (WebStorm, IntelliJ IDEA, etc.)
- **Project List**: All discovered projects with their associated IDEs
- **Project Metrics**: Quick overview of issues and tasks for each project
- **Refresh Button**: Update the data by rescanning your JetBrains cache directory

Click on a project name to drill into the details.

#### Project Graph Visualization
![Homepage Project Graph](images/Homepage%20Project%20Graph.png)

Selecting one or more projects from the list will enable a graph at the top of the page:
- **Project Statistics**: Visual representation of project cost and token usage

### 2. Project Management - Issues Overview

When you select a project, you can explore all issues associated with that project.

'Issues' in Junie relate to each separate conversation you have.  They will include 'tasks' for the initial
request and for each follow up until the task is done, stopped, declined etc.

![Project Issues Page](images/Project%20Issues%20Page.png)

The Project Issues page provides:
- **Issue Graph**: Shows the cost of each issue over time
- **Issue List**: All issues within the selected project
- **Issue Metadata**: Status, creation date, and other relevant information
- **Task Count**: Number of tasks associated with each issue
- **Navigation**: Easy access to drill down into specific issues

### 3. Issue Management - Task Tracking

Each issue contains multiple tasks that represent different aspects of the development workflow.

#### Task Overview
![Issue Tasks Page](images/Issue%20Tasks%20Page.png)

The Issue Tasks page shows:
- **Task List**: All tasks within the selected issue
- **Task Status**: Current state and progress of each task
- **Step Count**: Number of steps completed for each task
- **Task Metrics**: Performance and completion statistics

#### Task JSON
![Issue Tasks Page JSON](images/Issue%20Tasks%20Page%20JSON.png)

Clicking the 'JSON' button for the task will show the underlying log data for the task.

### 4. Task Management - Step-by-Step Workflow

Tasks are broken down into individual steps that provide granular insight into the development process.

#### Step Overview
![Task Steps Overview](images/Task%20Steps%20Overview.png)

The Task Steps page displays:
- **Step Sequence**: Chronological order of all steps in the task
- **Step Status**: Completion status and outcome of each step
- **Step Details**: Detailed information about what each step accomplished
- **Navigation Controls**: Easy browsing through step history

#### Step Visualization
![Task Steps Graph](images/Task%20Steps%20Graph.png)

The graph view provides:
- **Visual Step Flow**: Interactive graph showing step relationships and dependencies
- **Step Performance**: Visual indicators of step execution time and success rates
- **Interactive Exploration**: Click on steps to view detailed information

#### Step JSON data
![Task Steps JSON](images/Task%20Steps%20JSON.png)

Clicking the 'JSON' button for the step will show the underlying log data for the step.

#### Step Representations
![Task Steps Representations](images/Task%20Steps%20Representations.png)

Each step has a dialogue with the underlying model and clicking on the 'REP' button will show the detail of
the conversation for that step.

## Navigation Tips

1. **Breadcrumb Navigation**: Use the breadcrumb trail at the top of each page to navigate back to previous levels
2. **Refresh Data**: Use the refresh button on any page to update data from your JetBrains cache
3. **Filter Options**: Use IDE filters on the homepage to focus on specific development environments
4. **View Switching**: Toggle between list and graph views where available for different perspectives on your data

## Understanding Your Data

Junie Explorer reads data from your JetBrains cache directory, which contains:
- **Projects**: Your development projects across different IDEs
- **Issues**: Problems, features, or tasks you're working on
- **Tasks**: Specific work items within issues
- **Steps**: Individual actions or operations within tasks

This hierarchical structure allows you to understand your development workflow at different levels of detail, from high-level project overview down to individual development steps.

## Troubleshooting

If you don't see expected data:
1. Ensure your JetBrains IDEs have been used recently to generate cache data
2. Use the refresh button to rescan your cache directory
3. Check that the application has proper permissions to read your JetBrains cache directory
4. Verify that your JetBrains cache directory contains the expected project structure

For technical issues, refer to the [README.md](../README.md) file for installation and configuration details.