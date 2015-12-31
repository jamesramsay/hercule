# Contributing

If you want to contribute to Hercule, please use a GitHub pull request.
This is the fastest way for features and fixes to be reviewed and merged it into the code base.

To do this, clone the repo and run:

```bash
./scripts/init
```

This will install the necessary dependencies and configure project git hooks.

## Getting started

The process of submitting a pull request is fairly straightforward and generally follows the same pattern each time:

1. Create a new branch
2. Make your changes
3. Rebase onto upstream
4. Run the tests
5. Squash your commits
6. Double check your submission
7. Submit the pull request

## Commit conventions

Our commit message format is as follows:

```
Tag: Short description (fixes #1234)

Longer description here if necessary
The first line of the commit message (the summary) must have a specific format. This format is checked by our build tools.
```

The `Tag` is one of the following:

- `Fix` - for a bug fix.
- `New` - implemented a new feature.
- `Update` - for a backwards-compatible enhancement.
- `Breaking` - for a backwards-incompatible enhancement or feature.
- `Docs` - changes to documentation only.
- `Build` - changes to build process only.
- `Upgrade` - for a dependency upgrade.

The message summary should be a one-sentence description of the change, and it must be 72 characters in length or shorter. The issue number should be mentioned at the end. If the commit doesn't completely fix the issue, then use (`refs #1234`) instead of (`fixes #1234`).

Here are some good commit message summary examples:

```
Build: Update Travis to only test Node 0.10 (refs #734)
Fix: Special characters in link label causing parse error (fixes #840)
Upgrade: through2 to 2.0.0 (fixes #730)
```

The commit message format is important because these messages are used to create a changelog for each release. The tag and issue number help to create more consistent and useful changelogs.

## Code style and test coverage

All code should be simple, self documenting, and fully unit tested.

Please make sure all tests are passing locally, including code linting.
