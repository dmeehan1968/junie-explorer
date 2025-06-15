Feature: Homepage
  As a user
  I want to view JetBrains projects on the homepage
  So that I can explore the JetBrains projects found on my system

  Background:
    Given the application has access to the JetBrains logs directory
    And the user has a web browser

  Scenario: Homepage title
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a page titled "Junie Explorer"

  Scenario: Logs directory path display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see the path to the JetBrains logs directory

  Scenario: Projects list display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a list of all JetBrains projects

  Scenario: Project name display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then each project should display its name

  Scenario: IDE icons display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then each project should display icons for the IDEs it was used with

  Scenario: Reload button display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a reload button in the header

  Scenario: Reload button functionality
    Given there are JetBrains projects in the logs
    When the user clicks the reload button
    Then the page should redirect to the refresh route

  Scenario: IDE filter toolbar display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a toolbar with IDE filters

  Scenario: IDE filter functionality
    Given there are JetBrains projects in the logs
    When the user toggles an IDE filter
    Then only projects associated with the selected IDEs should be displayed

  Scenario: Project search display
    Given there are JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a search input field for filtering projects by name

  Scenario: Project search functionality
    Given there are JetBrains projects in the logs
    When the user enters text in the project search field
    Then only projects with names containing the search text should be displayed

  Scenario: No matching projects message
    Given there are JetBrains projects in the logs
    When the user applies filters that result in no matching projects
    Then the user should see a message indicating no matching projects were found

  Scenario: Empty homepage message
    Given there are no JetBrains projects in the logs
    When the user visits the homepage
    Then the user should see a message indicating no projects were found

  Scenario: Responsive layout on mobile devices
    Given there are JetBrains projects in the logs
    When the user visits the homepage on a mobile device
    Then the page should adjust its layout to fit the smaller screen

  Scenario: Projects accessibility on mobile
    Given there are JetBrains projects in the logs
    When the user visits the homepage on a mobile device
    Then all projects should still be visible and accessible

  Scenario: Project hover color effect
    Given there are JetBrains projects in the logs
    When the user hovers over a project item
    Then the item should change its background color

  Scenario: Project hover movement effect
    Given there are JetBrains projects in the logs
    When the user hovers over a project item
    Then the item should slightly move to indicate interactivity

  Scenario: Filter persistence
    Given the user has applied IDE filters
    When the user refreshes the page
    Then the previously selected IDE filters should be preserved
