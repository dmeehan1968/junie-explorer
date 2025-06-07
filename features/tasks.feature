Feature: Issue Tasks Page
  As a user
  I want to click on issue directories to navigate to a page showing tasks for that issue
  So that I can explore the tasks available for each issue

  Scenario: Viewing tasks for an issue
    Given I am on the issues page for a project
    When I click on an issue directory
    Then I should be taken to a page showing tasks for that issue
    And the tasks should be listed in order by index or creation date
    And I should see breadcrumb navigation with links to Home, IDE Projects, and Project Issues

  Scenario: Task information display
    Given I am on the tasks page for an issue
    Then I should see the following information for each task:
      | Task ID      |
      | Created Date |
      | Artifact Path|
      | Step Totals  |
    And the step totals should be displayed in a table format
    And the step totals table should include:
      | Input Tokens    |
      | Output Tokens   |
      | Cache Tokens    |
      | Cost            |
      | Total Time      |
    And the step totals table should have a single row with column headers
