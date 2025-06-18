Feature: Issue Details Page
  As a user
  I want to view details for a specific issue within a JetBrains project
  So that I can explore the tasks and metrics for that issue

  Scenario: Navigating from project page to issue details page
    Given a project
    And the user visits the project
    When the user clicks on an issue in the list
    Then the user should be taken to a page for that specific issue
    And the user should see a page titled with the issue name
    And the user should see a list of tasks available for that issue

  Scenario: Viewing IDE icons on issue details page
    Given a project has been used with multiple JetBrains IDEs
    When the user visits an issue
    Then the user should see 2 or more IDE icons

  Scenario: Reload button display
    Given there are Junie projects in the logs
    When the user visits the homepage
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given there are Junie projects in the logs
    When the user visits the homepage
    And the user clicks the reload button
    Then the reload button should indicate loading

  Scenario: Breadcrumb navigation display
    Given a project
    When the user visits an issue
    Then the user should see breadcrumb navigation showing the current location

  Scenario: Navigating back to project page
    Given a project
    When the user visits an issue
    And the user clicks on the "Project Name" link in the breadcrumb navigation
    Then the user should be taken back to the project page

  Scenario: Navigating back to homepage
    Given a project
    When the user visits an issue
    And the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage

  Scenario: Issue details display
    Given a project
    When the user visits an issue
    Then the user should see the issue creation date
    And the user should see the issue state with appropriate styling

  Scenario: Viewing task list with details
    Given a project
    When the user visits an issue
    Then the user should see a list of all tasks for that issue
    And each task should display its ID and creation date
    And each task should display metrics including input tokens, output tokens, cache tokens, cost, and total time

  Scenario: Task description display
    Given a project
    When the user visits an issue
    Then the task description should be displayed with Markdown formatting

  Scenario: Task link functionality
    Given a project
    When the user visits an issue
    And the user clicks on a task in the list
    Then the user should be taken to a page for that specific task

  Scenario: Issue without tasks reports no tasks
    Given a project without tasks
    When the user visits an issue
    Then the user should see a message indicating no tasks were found

  Scenario: JSON viewer button display
    Given a project
    When the user visits an issue
    Then each task should display a JSON button
    And the JSON data should be initially displayed in a collapsed view

  Scenario: JSON viewer button functionality
    Given a project
    When the user visits an issue
    And the user clicks on the JSON button for a task
    Then a JSON viewer should be displayed showing the raw task data

  Scenario: Toggling JSON viewer visibility
    Given a project
    When the user visits an issue
    And the user has opened the JSON viewer for a task
    And the user clicks on the JSON button again
    Then the JSON viewer should be hidden
