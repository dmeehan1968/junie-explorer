Feature: Issue Tasks Page
  As a user
  I want to click on issue directories to navigate to a page showing tasks for that issue
  So that I can explore the tasks available for each issue

  Scenario: Viewing tasks for an issue
    Given I am on the issues page for a project
    When I click on an issue directory
    Then I should be taken to a page showing tasks for that issue
    And the tasks should be listed in order by index or creation date
    And I should see a link to navigate back to the issues page

  Scenario: Task information display
    Given I am on the tasks page for an issue
    Then I should see the following information for each task:
      | Task ID      |
      | Created Date |
      | Artifact Path|