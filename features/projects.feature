Feature: Project Details Page
  As a user
  I want to view details for a specific JetBrains project
  So that I can explore the issues and metrics for that project

  Scenario: Navigating from homepage to project details page
    Given a project
    And the user visits the homepage
    When the user clicks on the project link
    Then the user should be taken to a page for that specific project
    And the user should see a page titled with the project name
    And the user should see a list of issues available for that project

  Scenario: Viewing IDE icons on project details page
    Given a project has been used with multiple JetBrains IDEs
    When the user visits the project
    Then the user should see 2 or more IDE icons

  Scenario: Reload button display
    Given a project without issues
    When the user visits the project
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given a project
    When the user visits the project
    And the user clicks the reload button
    Then the reload button should indicate loading

  Scenario: Breadcrumb navigation display
    Given a project
    When the user visits the project
    Then the user should see breadcrumb navigation showing the current location

  Scenario: Navigating back to homepage
    Given a project
    When the user visits the project
    And the user clicks on the "Projects" link in the breadcrumb navigation
    Then the user should be taken back to the homepage

  Scenario: Cost over time graph display
    Given a project
    When the user visits the project
    Then the user should see a graph visualizing issue costs over time

  Scenario: Project summary table display
    Given a project
    When the user visits the project
    Then the user should see a project summary table below the graph
    And the summary table should display aggregated metrics for all issues
    And the metrics should include input tokens, output tokens, cache tokens, cost, total time, and elapsed time
    And all numeric values should be formatted with thousands separators
    And the elapsed time should be formatted to show days, hours, and minutes, omitting any parts which are zero

  Scenario: Viewing issue list with details
    Given a project
    When the user visits the project
    Then the user should see a list of all issues for that project
    And each issue should display its name and state
    And each issue should display metrics including created date, input tokens, output tokens, cache tokens, cost, and total time

  Scenario: Issue state display
    Given a project
    When the user visits the project
    Then each issue should display its current state with appropriate styling

  Scenario: Issue link functionality
    Given a project
    When the user visits the project
    And the user clicks on an issue in the list
    Then the user should be taken to a page for that specific issue

  Scenario: Project without issues reports no issues
    Given a project without issues
    When the user visits the project
    Then the user should see a message indicating no issues were found

  Scenario: Project without issues shows no graph
    Given a project without issues
    When the user visits the project
    Then the cost over time graph should not be displayed

  Scenario: Reload button display
    Given a project
    When the user visits the project
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given a project
    When the user visits the project
    And the user clicks the reload button
    Then the reload button should indicate loading
