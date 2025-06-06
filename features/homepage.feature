Feature: Homepage
  As a user
  I want to view JetBrains IDE directories on the homepage
  So that I can explore the JetBrains IDEs installed on my system

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Viewing the homepage with IDE directories
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains IDE Explorer"
    And the user should see the path to the JetBrains cache directory
    And the user should see a list of all JetBrains IDE directories
    And each IDE directory should display its name

  Scenario: Viewing the homepage with no IDE directories
    Given there are no JetBrains IDE directories in the cache
    When the user visits the homepage
    Then the user should see a page titled "JetBrains IDE Explorer"
    And the user should see the path to the JetBrains cache directory
    And the user should see a message indicating no directories were found

  Scenario: Responsive design on different devices
    Given there are JetBrains IDE directories in the cache
    When the user visits the homepage on a mobile device
    Then the page should adjust its layout to fit the smaller screen
    And all IDE directories should still be visible and accessible

  Scenario: Hover effect on IDE directory items
    Given there are JetBrains IDE directories in the cache
    When the user hovers over an IDE directory item
    Then the item should change its background color
    And the item should slightly move to indicate interactivity