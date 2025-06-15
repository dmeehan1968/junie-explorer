@skip
Feature: Issue Details Page
  As a user
  I want to view details for a specific issue within a JetBrains project
  So that I can explore the tasks and metrics for that issue

  Background:
    Given the application has access to the JetBrains logs directory
    And the user has a web browser

  Scenario: Navigating from project page to issue details page
    Given there are issues for a specific JetBrains project
    When the user clicks on an issue link on the project page
    Then the user should be taken to a page for that specific issue
    And the user should see a page titled with the issue name
    And the user should see a list of tasks available for that issue

  Scenario: Viewing IDE icons on issue details page
    Given an issue belongs to a project that has been used with multiple JetBrains IDEs
    When the user visits the issue details page
    Then the user should see icons for each IDE that was used with the project

  Scenario: Reload button display
    Given there are tasks for a specific issue
    When the user visits the issue details page
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given the user is on an issue details page
    When the user clicks the reload button
    Then the page should redirect to the refresh route

  Scenario: Breadcrumb navigation display
    Given the user is on an issue details page
    Then the user should see breadcrumb navigation showing the current location

  Scenario: Navigating back to project page
    Given the user is on an issue details page
    When the user clicks on the project name link in the breadcrumb navigation
    Then the user should be taken back to the project page

  Scenario: Navigating back to homepage
    Given the user is on an issue details page
    When the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage

  Scenario: Issue details display
    Given there are tasks for a specific issue
    When the user visits the issue details page
    Then the user should see the issue creation date
    And the user should see the issue state with appropriate styling

  Scenario: Viewing task list with details
    Given there are tasks for a specific issue
    When the user visits the issue details page
    Then the user should see a list of all tasks for that issue
    And each task should display its ID and creation date
    And each task should display metrics including input tokens, output tokens, cache tokens, cost, and total time

  Scenario: Task description display
    Given a task has a description
    When the user visits the issue details page
    Then the task description should be displayed with Markdown formatting

  Scenario: Task link functionality
    Given there are tasks for a specific issue
    When the user clicks on a task in the list
    Then the user should be taken to a page for that specific task

  Scenario: Viewing issue details page with no tasks
    Given there are no tasks for a specific issue
    When the user visits the issue details page
    Then the user should see a message indicating no tasks were found

  Scenario: JSON viewer button display
    Given there are tasks for a specific issue
    When the user visits the issue details page
    Then each task should display a JSON button

  Scenario: JSON viewer button functionality
    Given the user is on an issue details page
    When the user clicks on the JSON button for a task
    Then a JSON viewer should be displayed showing the raw task data
    And the JSON data should be initially displayed in a collapsed view

  Scenario: Toggling JSON viewer visibility
    Given the user has opened the JSON viewer for a task
    When the user clicks on the JSON button again
    Then the JSON viewer should be hidden
