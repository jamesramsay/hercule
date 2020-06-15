# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.0.0] - 2020-06-15
### Removed

- Removed support for Node.js 8.x

## [4.1.0] - 2017-08-05
### Added

- Add `placeholder` argument to resolver API allowing resolver functions to pass the unmodified content back and skip the link. This allows the default behaviour where unresolvable links throw an error to be overridden with a best-effort approach.

## [4.0.1] - 2017-05-27
### Fixed

- Stack size error caused by a function that returned synchronously in some cases. Files with a thousands of line between transclusion could cause `hercule` to crash.

## [4.0.0] - 2017-02-19
### Added

- New support for alternative transclusion syntaxes including aglio, marked, and multimarkdown through both library and command line interface.
- Command line interface requires input to be explicitly specified, including stdin using `-` or `--stdin`.
- `transcludeString()` accepts a `source` option, replacing the `relativePath` option.
- `TranscludeStream()`, `transcludeString()`, and `transcludeFile()` accept a `resolvers` option allowing an array of functions to be provided for resolving URL's to input. For example, this could be used to support resolving secured HTTP content or resolving local links within a browser. Please refer to the [Resolvers](README.md#resolvers) documentation.
- `TranscludeStream()` emits a `sourcemap` event exactly once with the sourcemap object attached.
- `transcludeString()` and `transcludeFile()` return a sourcemap as the third callback argument. A list of source paths can be extracted from the object.

### Changed

- `TranscludeStream()` now requires a source is specified.
- `TranscludeStream()` and `transcludeFile()` now resolve transclusion links will relative to the specified source.

### Removed

- `TranscludeStream()`, `transcludeString()`, and `transcludeFile()` no longer support `relativePath` option.
- `transcludeString()` and `transcludeFile()` no longer return an array of source paths as the third callback argument.
