## Contributing

We love contributions! Whether it's a bug fix, a new feature, or an improvement to the documentation, your help is always appreciated.

### How to Contribute

Before you start, please take a moment to review our comprehensive [Contributing Guide](CONTRIBUTING.md). This guide provides detailed instructions on how to set up your development environment, submit bug reports, suggest features, and submit pull requests.

We also have a [Code of Conduct](CODE_OF_CONDUCT.md) that all contributors are expected to follow, ensuring a welcoming and inclusive environment for everyone.

### Where to Start?

*   **Good First Issues**: We've marked issues that are great for first-time contributors with the `good first issue` label. Check them out [here](https://github.com/dmeehan1968/junie-explorer/labels/good%20first%20issue).
*   **Feature Requests**: Have an idea for a new feature? Open an issue to discuss it.
*   **Bug Reports**: Found a bug? Please report it!
*   **Documentation Improvements**: Help us make our documentation clearer and more helpful.

### Change Methodology

Junie Explorer has been developed exclusively with JetBrains Junie.  During development
I found that code quality and successful feature implementation was greatly enhanced
by using Sonnet 4 and 'think more' ('smarter') mode.

The `features` directory contains high level specifications (and potential acceptance tests)
for all features, and this can be leveraged by Junie to help it understand what your 
request pertains to.

If you want to offer changes for incorporation in to the project, then you will need
to create a fork of the repository to work in.  If you are unfamiliar with collaboration
in Github, there are plenty of guides online.  Indeed you may be able to ask Junie to
assist.

A good workflow is to create a feature branch, then ask Junie to make changes.  If you 
are not sure the direction Junie will take, start in 'Ask' mode and when you are happy
with the direction, switch to 'Code' mode and issue a follow up to implement the changes
as described.  I often use a statement like this at the end of the prompt:

> "Update the relevant feature files and implement as described"

When you push your feature branch to your own fork, you will then be able to go to
the main repo and create a pull request.  If you do this early in your process, others
will be able to see that you are working on a feature. Ideally if you reference
any related issue in the pull request (use #<issue number>) then the issue will also
contain a note that a pull request is open.

Mark your pull request as draft/work in progress so that we know not to consider it
complete.

Before finalising your request, you should fetch from the main repo and rebase your
feature branch on main, as this will highlight any potential merge conflicts.  We may
ask you to do this if there is a lag in between when you complete your feature request
and we come to review and accept the changes, if there is too much drift for us to
reconcile.

Thank you for considering contributing to [Junie Explorer]!