Feature: Homepage
  As a user
  I want to view JetBrains IDE directories on the homepage
  So that I can explore the JetBrains IDEs installed on my system

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Homepage title
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains IDE Explorer"

  Scenario: Cache directory path display
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see the path to the JetBrains cache directory

  Scenario: IDE directories list display
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a list of all JetBrains IDE directories

  Scenario: IDE directory name display
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage
    Then each IDE directory should display its name

  Scenario: Empty homepage title
    Given there are no JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains IDE Explorer"

  Scenario: Empty homepage cache path display
    Given there are no JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see the path to the JetBrains cache directory

  Scenario: Empty homepage message
    Given there are no JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a message indicating no directories were found

  Scenario: Responsive layout on mobile devices
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage on a mobile device
    Then the page should adjust its layout to fit the smaller screen

  Scenario: IDE directories accessibility on mobile
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage on a mobile device
    Then all IDE directories should still be visible and accessible

  Scenario: IDE directory hover color effect
    Given there are JetBrains IDE directories in the cache
    When the user hovers over an IDE directory item
    Then the item should change its background color

  Scenario: IDE directory hover movement effect
    Given there are JetBrains IDE directories in the cache
    When the user hovers over an IDE directory item
    Then the item should slightly move to indicate interactivity
