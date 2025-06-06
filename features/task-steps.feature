Feature: Task Steps Page
  As a user
  I want to click on task directories to navigate to a page showing steps for that task
  So that I can explore the steps available for each task

  Scenario: Viewing steps for a task
    Given I am on the tasks page for an issue
    When I click on a task directory
    Then I should be taken to a page showing steps for that task
    And the steps should be listed in a table format
    And I should see a link to navigate back to the tasks page

  Scenario: Step information display
    Given I am on the steps page for a task
    Then I should see a table with the following columns:
      | Title   |
      | Summary |
      | Metrics |
    And the metrics should be displayed in columns rather than rows
    And the metrics should include:
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
    And the model time value should be displayed as HH:MM:SS.MS
    And the model cached time value should be displayed as HH:MM:SS.MS

  Scenario: Table footer with summary information
    Given I am on the steps page for a task
    Then I should see a footer row in the table with summary information
    And the footer row should include:
      | Sum of input tokens |
      | Sum of output tokens |
      | Sum of cache tokens |
      | Sum of cost |
      | Sum of build time (formatted as HH:MM:SS) |
      | Sum of model time (formatted as HH:MM:SS.MS) |
