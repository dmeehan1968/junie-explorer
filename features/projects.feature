Feature: Project Details Page
  As a user
  I want to view details for a specific JetBrains project
  So that I can explore the issues and metrics for that project

  Background:
    Given the application has access to the JetBrains logs directory
    And the user has a web browser

  Scenario: Navigating from homepage to project details page
    Given there are JetBrains projects in the logs
    When the user clicks on a project link on the homepage
    Then the user should be taken to a page for that specific project
    And the user should see a page titled with the project name
    And the user should see a list of issues available for that project

  Scenario: Viewing IDE icons on project details page
    Given a project has been used with multiple JetBrains IDEs
    When the user visits the project details page
    Then the user should see icons for each IDE that was used with the project

  Scenario: Reload button display
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given the user is on a project details page
    When the user clicks the reload button
    Then the page should redirect to the refresh route

  Scenario: Breadcrumb navigation display
    Given the user is on a project details page
    Then the user should see breadcrumb navigation showing the current location

  Scenario: Navigating back to homepage
    Given the user is on a project details page
    When the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage

  Scenario: Cost over time graph display
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a graph visualizing issue costs over time

  Scenario: Cost over time graph not displayed for empty projects
    Given there are no issues for a specific JetBrains project
    When the user visits the project details page
    Then no cost over time graph should be displayed

  Scenario: Project summary table display
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a project summary table below the graph
    And the summary table should display aggregated metrics for all issues
    And the metrics should include input tokens, output tokens, cache tokens, cost, total time, and elapsed time
    And all numeric values should be formatted with thousands separators
    And the elapsed time should be formatted to show days, hours, and minutes, omitting any parts which are zero

  Scenario: Viewing issue list with details
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a list of all issues for that project
    And each issue should display its name and state
    And each issue should display metrics including created date, input tokens, output tokens, cache tokens, cost, and total time

  Scenario: Issue state display
    Given there are issues for a specific JetBrains project
    When the user visits the project details page
    Then each issue should display its current state with appropriate styling

  Scenario: Issue link functionality
    Given there are issues for a specific JetBrains project
    When the user clicks on an issue in the list
    Then the user should be taken to a page for that specific issue

  Scenario: Viewing project details page with no issues
    Given there are no issues for a specific JetBrains project
    When the user visits the project details page
    Then the user should see a message indicating no issues were found
