Feature: Project Issues
  As a user
  I want to view issues for a specific project
  So that I can explore the issues available for that project

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Navigating to project issues page
    Given there are projects for a specific JetBrains IDE
    When the user clicks on a project name
    Then the user should be redirected to a project issues page

  Scenario: Viewing project issues page title
    Given the user has navigated to a project issues page
    Then the user should see a page titled with the project name

  Scenario: Viewing list of project issues
    Given the user has navigated to a project issues page
    When the page loads
    Then the user should see a list of all issues for that project

  Scenario: Viewing issue details
    Given the user is viewing a list of project issues
    Then each issue should display its name, status, and simplified metrics in a table format

  Scenario: Issue table layout
    Given the user is viewing a list of project issues
    Then the timestamp should be in the first column of the table
    And the status should be right-aligned to the right of the issue title
    And the table columns should be equally divided in width
    And the cell text should be horizontally centered

  Scenario: Viewing issue metrics
    Given the user is viewing issue details
    Then the simplified metrics should show the totals for the issue's tasks

  Scenario: Viewing detailed metrics information
    Given the user is viewing issue metrics
    Then the metrics should include Input Tokens, Output Tokens, Cache Tokens, Cost, and Total Time

  Scenario: Navigating to empty project issues page
    Given there is a project with no issues
    When the user clicks on the project name
    Then the user should be redirected to a project issues page

  Scenario: Viewing empty project issues page
    Given the user has navigated to a project with no issues
    Then the user should see a page titled with the project name
    And the user should see a message indicating no issues were found

  Scenario: Navigating back to projects list
    Given the user is on a project issues page
    When the user clicks on the IDE name link in the breadcrumb navigation
    Then the user should be redirected to the IDE projects page

  Scenario: Responsive layout on mobile devices
    Given there are issues for a specific project
    When the user visits the project issues page on a mobile device
    Then the page should adjust its layout to fit the smaller screen

  Scenario: Issue accessibility on mobile devices
    Given the user is viewing the project issues page on a mobile device
    Then all issues should still be visible and accessible
