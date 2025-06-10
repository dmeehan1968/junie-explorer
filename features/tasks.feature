Feature: Issue Tasks Page
  As a user
  I want to click on issue directories to navigate to a page showing tasks for that issue
  So that I can explore the tasks available for each issue

  Scenario: Navigating to issue tasks page
    Given I am on the issues page for a project
    When I click on an issue directory
    Then I should be taken to a page showing tasks for that issue

  Scenario: Task listing order
    Given I am on the tasks page for an issue
    Then the tasks should be listed in order by index or creation date

  Scenario: Breadcrumb navigation on tasks page
    Given I am on the tasks page for an issue
    Then I should see breadcrumb navigation with links to Home, IDE Projects, and Project Issues

  Scenario: Task basic information display
    Given I am on the tasks page for an issue
    Then I should see the following information for each task:
      | Task ID      |
      | Created Date |
      | Step Totals  |

  Scenario: Step totals display format
    Given I am on the tasks page for an issue
    Then the step totals should be displayed in a table format

  Scenario: Step totals table content
    Given I am on the tasks page for an issue
    Then the step totals table should include:
      | Input Tokens    |
      | Output Tokens   |
      | Cache Tokens    |
      | Cost            |
      | Total Time      |

  Scenario: Step totals table structure
    Given I am on the tasks page for an issue
    Then the step totals table should have a single row with column headers
