# Example: Technical documents

Writing long documents, particularly technical documents, may require repetition of certain information.
Hercule helps reduce repetition in line with DRY–don't repeat yourself–principles.

```markdown
# Transclusions in Markdown

John Appleseed
(University of Technology)

## Abstract
:[Abstract](src/abstract.md)

...

```

Transcluding a document:

```bash
hercule src/transclusions-in-markdown.md -o final.md
```

Omitting the `output` argument allows the output to be piped into other text processing tools:

```bash
hercule src/transclusions-in-markdown.md | pandoc -o final.pdf
```
