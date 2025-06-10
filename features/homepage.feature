Feature: Homepage
  As a user
  I want to view JetBrains projects on the homepage
  So that I can explore the JetBrains projects found on my system

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Homepage title
    Given there are JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains Project Explorer"

  Scenario: Cache directory path display
    Given there are JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see the path to the JetBrains cache directory

  Scenario: Projects list display
    Given there are JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see a list of all JetBrains projects

  Scenario: Project name display
    Given there are JetBrains projects in the cache
    When the user visits the homepage
    Then each project should display its name

  Scenario: IDE icons display
    Given there are JetBrains projects in the cache
    When the user visits the homepage
    Then each project should display icons for the IDEs it was used with

  Scenario: Empty homepage title
    Given there are no JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains Project Explorer"

  Scenario: Empty homepage cache path display
    Given there are no JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see the path to the JetBrains cache directory

  Scenario: Empty homepage message
    Given there are no JetBrains projects in the cache
    When the user visits the homepage
    Then the user should see a message indicating no projects were found

  Scenario: Responsive layout on mobile devices
    Given there are JetBrains projects in the cache
    When the user visits the homepage on a mobile device
    Then the page should adjust its layout to fit the smaller screen

  Scenario: Projects accessibility on mobile
    Given there are JetBrains projects in the cache
    When the user visits the homepage on a mobile device
    Then all projects should still be visible and accessible

  Scenario: Project hover color effect
    Given there are JetBrains projects in the cache
    When the user hovers over a project item
    Then the item should change its background color

  Scenario: Project hover movement effect
    Given there are JetBrains projects in the cache
    When the user hovers over a project item
    Then the item should slightly move to indicate interactivity
