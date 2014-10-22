# Markdown Transclude

[![Build Status](https://travis-ci.org/jamesramsay/md-transclude.svg)](https://travis-ci.org/jamesramsay/md-transclude)

`md-transclude` is a document transclusion tool for Markdown documents.

```bash
md-transclude src/document.md -o document.md
```

## Writing documents

When regularly writing long documents in Markdown,
there may be common pieces of content that you would like to reuse.
This is often true of technical documentation.
For example, describing an API with [API Blueprint](http://apiblueprint.org) benefits from applying DRY (don't repeat yourself) principles.

```markdown
# Transclusions in Markdown

John Appleseed
(University of Technology)

## Abstract
{{src/abstract.md}}

...

```

The transcluded document is generated

```bash
md-transclude src/transclusions-in-markdown.md -o final.md
```

Omitting the `output` argument allows the output to be piped into other text processing tools.

```bash
md-transclude src/transclusions-in-markdown.md | pandoc -o final.pdf
```

## Syntax

Example: `apple.md` is transcluded into a document.

```markdown
{{apple.md}}
```

Example: `fruit.md` is transcluded into a document, `apple.md` is parameterically transcluded into `fruit.md`, and `common/footer.md` is parameterically transcluded into `footer.md`.

```markdown
{{fruit.md fruit:apple.md footer:common/footer.md}}
```

### Simple transclusion

`document`

> An example document
>
> {{`dependency`}}

A document may contain any number of transclusions.
Dependencies will be processed and dependencies located based on the path of the initial document.

### Paramaterized transclusion

`document`

> An example document
>
> {{`dependency` `parameter`}}

Expected parameter formats are:

- `filename`
  The default placeholder `{{md-transclude}}` will be replaced with `{{filename}}`.
- `placeholder:filename`
  The specified placeholder `{{placeholder}}` will be replaced with `{{filename}}`.

### Whitespace sensitivity

Leading whitespace is significant in Markdown and is therefore preserved where
the line begins with whitespace.

```markdown
Binary sort example:

  {{snippet.c}}

```

This may also be useful for nesting lists.

```markdown
- Apple
  {{apple-varieties.md}}
- Orange
  {{orange-varieties.md}}
- Pear
  {{pear-varieties.md}}
```
