Feature: Task Steps Page
  As a user
  I want to click on task directories to navigate to a page showing steps for that task
  So that I can explore the steps available for each task

  Scenario: Metrics graph on task steps page
    Given I am on the steps page for a task
    Then I should see a graph showing cost and token metrics over time
    And the graph should show cost as one line
    And the graph should show aggregate of input, output, and cache tokens as another line
    And the graph should have points connected by lines
    And the x-axis tick marks should be adjusted for short timeframes

  Scenario: Navigating to task steps page
    Given I am on the tasks page for an issue
    When I click on a task directory
    Then I should be taken to a page showing steps for that task

  Scenario: Viewing steps in table format
    Given I am on the steps page for a task
    Then the steps should be listed in a table format

  Scenario: Breadcrumb navigation on steps page
    Given I am on the steps page for a task
    Then I should see breadcrumb navigation with links to Home, IDE Projects, Project Issues, and Tasks

  Scenario: Step table column structure
    Given I am on the steps page for a task
    Then I should see a table with the following columns:
      | Title   |
      | Summary |
      | Metrics |

  Scenario: Metrics display format
    Given I am on the steps page for a task
    Then the metrics should be displayed in columns rather than rows

  Scenario: Available metrics in step table
    Given I am on the steps page for a task
    Then the metrics should include:
      | Input Tokens    |
      | Output Tokens   |
      | Cache Tokens    |
      | Cost            |
      | Cached Cost     |
      | Build Time      |
      | Artifact Time   |
      | Model Time      |
      | Model Cached Time |
      | Requests        |
      | Cached Requests |

  Scenario: Model time display format
    Given I am on the steps page for a task
    Then the model time value should be displayed as HH:MM:SS.MS

  Scenario: Model cached time display format
    Given I am on the steps page for a task
    Then the model cached time value should be displayed as HH:MM:SS.MS

  Scenario: Table footer presence
    Given I am on the steps page for a task
    Then I should see a footer row in the table with summary information

  Scenario: Table footer content
    Given I am on the steps page for a task with a footer row
    Then the footer row should include:
      | Sum of input tokens |
      | Sum of output tokens |
      | Sum of cache tokens |
      | Sum of cost |
      | Sum of cached cost |
      | Sum of build time (formatted as HH:MM:SS) |
      | Sum of artifact time (formatted as HH:MM:SS) |
      | Sum of model time (formatted as HH:MM:SS.MS) |
      | Sum of model cached time (formatted as HH:MM:SS.MS) |
      | Sum of requests |
      | Sum of cached requests |
