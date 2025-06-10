Feature: Project Details Page
  As a user
  I want to view details for a specific JetBrains project
  So that I can explore the issues and metrics for that project

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Navigating from homepage to project details page
    Given there are JetBrains projects in the cache
    When the user clicks on a project link on the homepage
    Then the user should be taken to a page for that specific project
    And the user should see a page titled with the project name
    And the user should see a list of issues available for that project

  Scenario: Viewing IDE icons on project details page
    Given a project has been used with multiple JetBrains IDEs
    When the user visits the project details page
    Then the user should see icons for each IDE that was used with the project

  Scenario: Viewing project details page with issues
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a table of all issues for that project
    And the table should have columns for Issue Name, Created, State, Tasks, Input Tokens, Output Tokens, Cache Tokens, Cost, and Total Time
    And the user should see a summary of project metrics

  Scenario: Viewing project details page with no issues
    Given there are no issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a message indicating no issues were found

  Scenario: Navigating back to homepage
    Given the user is on a project details page
    When the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage
