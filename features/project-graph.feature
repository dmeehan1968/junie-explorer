@skip
Feature: Project Graph on Homepage
  As a user
  I want to see a graph of project metrics on the homepage
  So that I can visualize cost and token usage across selected projects over time

  Background:
    Given the application has access to the JetBrains logs directory
    And there are JetBrains projects with issues in the logs
    And the user is on the homepage

  Scenario: Graph container is present
    When the user visits the homepage
    Then the user should see a graph container for project metrics

  Scenario: Graph is initially hidden
    Given no projects are currently selected
    When the user visits the homepage
    Then the project graph should be hidden by default

  Scenario: Graph appears when projects are selected
    Given no projects are currently selected
    When the user selects one or more projects using checkboxes
    Then the project graph should become visible
    And the graph should display metrics for the selected projects

  Scenario: Graph disappears when all projects are deselected
    Given one or more projects are selected and the graph is visible
    When the user deselects all projects
    Then the project graph should become hidden

  Scenario: Graph updates when project selection changes
    Given some projects are selected and the graph is visible
    When the user changes the project selection by selecting or deselecting projects
    Then the graph should update to show metrics only for the currently selected projects

  Scenario: Graph shows cost metrics by default
    Given projects are selected and the graph is visible
    When the display option is set to "Both" (default)
    Then the graph should display both cost and token metrics for selected projects

  Scenario: Graph shows only cost metrics when cost option selected
    Given projects are selected and the graph is visible
    When the user selects the "Cost" display option
    Then the graph should display only cost metrics for selected projects
    And token metrics should not be visible

  Scenario: Graph shows only token metrics when tokens option selected
    Given projects are selected and the graph is visible
    When the user selects the "Tokens" display option
    Then the graph should display only token metrics for selected projects
    And cost metrics should not be visible

  Scenario: Graph shows both metrics when both option selected
    Given projects are selected and the graph is visible
    When the user selects the "Both" display option
    Then the graph should display both cost and token metrics for selected projects

  Scenario: Graph persists selection across page refreshes
    Given the user has selected projects and the graph is visible
    When the user refreshes the page
    Then the previously selected projects should remain selected
    And the project graph should be visible with the same projects

  Scenario: Graph displays different colors for different projects
    Given multiple projects are selected and the graph is visible
    Then each project should be represented by a different colored line in the graph

  Scenario: Graph shows appropriate time scale
    Given projects with issues spanning different time periods are selected
    When the graph is displayed
    Then the horizontal axis should cover the date range of all selected project issues
    And the time scale should be appropriate for the date range (hour/day/week/month/year)

  Scenario: Graph handles projects with no issues
    Given projects with no issues are selected
    When the graph is displayed
    Then the graph should handle projects with no data gracefully
    And should not display error messages

  Scenario: Graph animation on show
    Given no projects are selected and the graph is hidden
    When the user selects projects
    Then the graph should appear with a smooth animation transition

  Scenario: Graph animation on hide
    Given projects are selected and the graph is visible
    When the user deselects all projects
    Then the graph should disappear with a smooth animation transition

  Scenario: Select all functionality affects graph
    Given no projects are selected and the graph is hidden
    When the user clicks "Select All" checkbox
    Then all projects should be selected
    And the project graph should become visible showing all projects

  Scenario: Deselect all functionality affects graph
    Given all projects are selected using "Select All" and the graph is visible
    When the user unchecks the "Select All" checkbox
    Then all projects should be deselected
    And the project graph should become hidden