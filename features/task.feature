@pending
Feature: Task Details Page
  As a user
  I want to view details for a specific task within an issue
  So that I can explore the steps and metrics for that task

  Background:
    Given the application has access to the JetBrains logs directory
    And the user has a web browser

  Scenario: Navigating from issue page to task details page
    Given there are tasks for a specific issue
    When the user clicks on a task link on the issue page
    Then the user should be taken to a page for that specific task
    And the user should see a page titled with the task ID

  Scenario: Viewing IDE icons on task details page
    Given a task belongs to a project that has been used with multiple JetBrains IDEs
    When the user visits the task details page
    Then the user should see icons for each IDE that was used with the project

  Scenario: Reload button display
    Given there are steps for a specific task
    When the user visits the task details page
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given the user is on a task details page
    When the user clicks the reload button
    Then the page should redirect to the refresh route

  Scenario: Breadcrumb navigation display
    Given the user is on a task details page
    Then the user should see breadcrumb navigation showing the current location

  Scenario: Navigating back to issue page
    Given the user is on a task details page
    When the user clicks on the issue name link in the breadcrumb navigation
    Then the user should be taken back to the issue page

  Scenario: Navigating back to project page
    Given the user is on a task details page
    When the user clicks on the project name link in the breadcrumb navigation
    Then the user should be taken back to the project page

  Scenario: Navigating back to homepage
    Given the user is on a task details page
    When the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage

  Scenario: Task details display
    Given there are steps for a specific task
    When the user visits the task details page
    Then the user should see the task creation date

  Scenario: Task description display
    Given a task has a description
    When the user visits the task details page
    Then the task description should be displayed with Markdown formatting
    And the description should be labeled as "User"

  Scenario: Task plan display
    Given a task has a plan
    When the user visits the task details page
    Then the task plan should be displayed with Markdown formatting
    And the plan should be labeled as "Agent"

  Scenario: Metrics graph display
    Given there are steps for a specific task
    When the user visits the task details page
    Then the user should see a graph visualizing step metrics over time
    And the graph should have a cost axis and a tokens axis
    And the graph should display cost and token data points for each step

  Scenario: Steps table display
    Given there are steps for a specific task
    When the user visits the task details page
    Then the user should see a table of all steps for that task
    And the table should have columns for step number, tokens, costs, time, and requests
    And the table should have a footer row with totals for each metric

  Scenario: Raw data view for steps
    Given there are steps for a specific task
    When the user visits the task details page
    Then each step should have a "JSON" button in the first row
    When the user clicks on a "JSON" button
    Then a second row should appear below the step row
    And the second row should contain the raw JSON data for that step
    And the JSON data should be interactive with collapsible nodes
    And the JSON data should have syntax highlighting
    And the JSON data should be constrained to the width of the table with scroll bars for overflow
    And the JSON data should have a limited height to prevent it from becoming too tall

  Scenario: Representations view for steps
    Given there are steps for a specific task
    When the user visits the task details page
    Then each step should have a "REP" button in the first row
    When the user clicks on a "REP" button
    Then a third row should appear below the step row
    And the third row should contain the representations data for that step
    And the representations data should be displayed as formatted HTML
    And the representations data should be constrained to the width of the table with horizontal scroll bars for overflow
    And the representations data should have a limited height to prevent it from becoming too tall
    When the user clicks the "REP" button again
    Then the representations row should be hidden
    And subsequent clicks should show and hide the representations without making additional requests

  Scenario: Viewing task details page with no steps
    Given there are no steps for a specific task
    When the user visits the task details page
    Then the user should see a message indicating no steps were found
    And no metrics graph should be displayed
