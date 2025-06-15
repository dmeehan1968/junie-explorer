@skip
Feature: Graph of issue cost over time
  As a user
  I want to see a line graph showing the total cost of each issue over time
  So that I can visualize how costs accumulate across issues

  Background:
    Given I am on the project issues page

  Scenario: Basic graph presence
    Then I should see a line graph showing the total cost of each issue over time

  Scenario: Horizontal axis configuration
    Then the horizontal scale should cover the min/max dates of all issues
    And the horizontal axis should have suitable tick marks and date values

  Scenario: Vertical axis configuration
    Then the vertical axis should have suitable tick marks and cost values

  Scenario: Issue representation
    Then each issue should be represented by a different colored line
