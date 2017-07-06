# Hercule – Transclusion Tool

[![Version](https://img.shields.io/npm/v/hercule.svg)](https://npmjs.com/package/hercule)
[![License](https://img.shields.io/npm/l/hercule.svg)](https://npmjs.com/package/hercule)
[![Build Status](https://img.shields.io/travis/jamesramsay/hercule/master.svg)](https://travis-ci.org/jamesramsay/hercule)
[![Coverage Status](https://img.shields.io/codecov/c/github/jamesramsay/hercule/master.svg)](https://codecov.io/github/jamesramsay/hercule)
[![Dependency Status](https://img.shields.io/david/jamesramsay/hercule.svg)](https://david-dm.org/jamesramsay/hercule)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

<a href="https://www.npmjs.com/package/hercule">
  <img src="https://cdn.rawgit.com/jamesramsay/hercule/16c858e8048830bd058ed632e59a988d67845029/hercule.svg" alt="Hercule" width="128px">
</a>

Write large markdown documents, including [API Blueprint](http://apiblueprint.org), while keeping things DRY (don't repeat yourself).

Hercule is a command-line tool and library for transcluding markdown, [API Blueprint](http://apiblueprint.org), and plaintext. This allows complex and repetitive documents to be written as smaller logical documents, for improved consistency, reuse, and separation of concerns.

- Simple extension of markdown link syntax `:[Title](link.md)` (preceding colon `:`)
- Transclude local files
- Transclude remote (HTTP) files
- Transclude strings
- Smart indentation

-----

## Installation

Install Hercule using [npm](http://npmjs.org):

```bash
$ npm install -g hercule
```

## Usage

You can use Hercule as a command-line utility:

```bash
hercule src/blueprint.md -o output.md
```

Hercule supports processing input from stdin, and writing to stdout:

```
cat src/blueprint.md | hercule - | less
```

Or you can use Hercule as a library:

```javascript
import { trancludeString } from 'hercule';

trancludeString('# Title\n\n:[abstract](abstract.md)', (err, output) => {
  if (err) console.log(err)
  console.log(output);
});
```

## Transclusion Syntax

### Basic transclusion (local files and remote HTTP files)

Hercule extends the Markdown inline link syntax with a leading colon (`:`) to denote the link should transcluded.

```javascript
import { trancludeString } from 'hercule';

trancludeString('This is an :[example link](foo.md).', (err, output) => {
  if (err) console.log(err)
  console.log(output);
  // This is an example transclusion.
});
```

Extending the standard Markdown link syntax means most markdown parsers will treat Hercule's transclusion links as standard Markdown links.
For example, Github handles transclusion links in this manner.

Hercule is also able to transclude HTTP links.

```javascript
import { trancludeString } from 'hercule';

input = 'Jackdaws love my :[size](https://raw.githubusercontent.com/jamesramsay/hercule/master/test/fixtures/basic/size.md) sphinx of quartz.';

trancludeString(input, (err, output) => {
  if (err) console.log(err)
  console.log(output);
  // Jackdaws love my big sphinx of quartz.
});
```

### Placeholders and overriding references

Placeholders (e.g. `:[foo](bar)`) allow you create a target for transclusion without specifying the link in the document.
A parent document can then override the placeholder with the desired link.

Placeholders and references can be helpful for increasing the _'dryness'_ of your source documents,
or allowing environmental variables to be passed into the document during processing.

```javascript
import { transcludeString } from 'hercule';

const input = ':[foo](bar)';
const options = {
  references: [{
    placeholder: 'bar',
    href: 'fizz buzz',
    hrefType: 'string'
  }]
};

trancludeString(input, (err, output) => {
  if (err) console.log(err)
  console.log(output);
  // fizz buzz
});
```

References are passed down to any nested transclusion links.

### Default placeholders

Sometimes a file might be used in multiple contexts, some contexts requiring references and others not.
Default placeholders help handle this situation more conveniently.

The following example uses Apiary's [Markdown Syntax for Object Notation (MSON)](https://github.com/apiaryio/mson).

```mson
## Ingredient (object)

- id: 1 (number, required)
- name: Cucumber (string, required)
- description: Essential for tzatziki (string, :[is required](required || "optional"))
```

```javascript
import { transcludeString } from 'hercule';

const inputRequired = ':[Required Ingredient](cucmber.mson required:"required")';
const inputDefault = ':[Optional Ingredient](cucmber.mson)';

trancludeString(inputRequired, (err, output) => {
  if (err) console.log(err)
  console.log(output);
  // ## Recipe (object)
  //
  // - id: 1 (number, required)
  // - name: Cucumber (string, required)
  // - description: Essential for tzatziki (string, required)
});


trancludeString(inputDefault, (err, output) => {
  if (err) console.log(err)
  console.log(output);
  // ## Recipe (object)
  //
  // - id: 1 (number, required)
  // - name: Cucumber (string, required)
  // - description: Essential for tzatziki (string, optional)
});
```

### Whitespace sensitivity

Leading whitespace is significant in Markdown.
Hercule preserves whitespace at the beginning of each line.

```markdown
Binary sort example:

  :[](snippet.c)

```

Each line of `snippet.c` will be indented with the whitespace preceding it.

## Documentation

- [`TranscludeStream`](#transclude)
- [`transcludeString`](#transcludeString)
- [`transcludeFile`](#transcludeFile)
- [Resolvers](#resolvers)
- [Custom Transclusion Syntax](#customSyntax)

---------------------------------------

<a name="transclude" />

### TranscludeStream(source, [options])

Returns a duplex stream.

__Arguments__

1. `source` (_String_): A string used for resolving relative links and generating sourcemap.
2. `options` (_Object_): An object of options to be applied when processing input.
  - `resolvers` (_Array[Function]_): An array of functions which are applied to resolve the URLs to content.
  - `transclusionSyntax` (_String_): Choose transclusion link syntax. Supports 'hercule', 'aglio', 'marked', 'multimarkdown'.

__Customer Emitters__

- `sourcemap` (_Object_): A sourcemap object will be emitted exactly once.

__Examples__

```javascript
import { TranscludeStream } from 'hercule';

const trancluder = new TranscludeStream();

transcluder.on('error', (err) => {
  // Handle exceptions like dead links
  console.log(err);
});

// assuming input is a readable stream and output is a writable stream
input.pipe(transcluder).pipe(output);
```

---------------------------------------

<a name="transcludeString" />

### transcludeString(str, [options], callback)

Transcludes the input `str`, and `callback` is called when finished.

__Arguments__

1. `str` (_String_): A string to process.
2. `options` (_Object_): An object of options to be applied when processing input.
  - `source` (_String_): source file required for resolving relative links and generating sourcemap.
  - `resolvers` (_Array[Function]_): An array of functions which are applied to resolve the URLs to content.
  - `transclusionSyntax` (_String_): Choose transclusion link syntax. Supports 'hercule', 'aglio', 'marked', 'multimarkdown'.
3. `callback(err, [output], [sourcemap])` (_Function_): A function that will be called after the input `str` has been processed.
  - `err` (_Error_): An error object.
  - `output` (_String_): A string containing processed input.
  - `sourcemap` (_Object_): A sourcemap object.

__Examples__

```javascript
import { trancludeString } from 'hercule';

trancludeString(':[foo](bar.md)', (err, output) => {
  // Handle exceptions like dead links
  if (err) console.log(err)
  console.log(output);
});
```

---------------------------------------

<a name="transcludeFile" />

### transcludeFile(source, [options], callback)

Transcludes the `source` file.

__Arguments__

1. `source` (_String_): A path to a file to process.
2. `options` (_Object_): An object of options to be applied when processing input.
  - `resolvers` (_Array[Function]_): An array of functions which are applied to resolve the URLs to content.
  - `transclusionSyntax` (_String_): Choose transclusion link syntax. Supports 'hercule', 'aglio', 'marked', 'multimarkdown'.
3. `callback(err, [output], [sourcemap])` (_Function_): A function that will be called after the `source` file has been processed.
  - `err` (_Error_): An error object.
  - `output` (_String_): A string containing processed input.
  - `sourcemap` (_Object_): A sourcemap object.

__Examples__

```javascript
import { trancludeFile } from 'hercule';

trancludeFile('foo.md', (err, output) => {
  // Handle exceptions like dead links
  if (err) console.log(err)
  console.log(output);
});
```

---------------------------------------

<a name="resolvers" />

### Resolvers

Resolver functions transform urls into the input to be transcluded.

Hercule includes resolvers for http urls, local files, and strings. You can replace these with your own resolvers to customise the behaviour.

__Arguments__

1. `url` - A relative url from the input being processed.
2. `source` - The absolute source url of the url being resolved.
3. `placeholder` - The transclusion link that was resolved to the url.

__Returns__

- (_null_): Returns null if the url cannot be resolved.
- (_Object_)
  - `content` (_Stream | String_): The content to be transcluded. Streams are processed for further transclusion links. Strings are assumed fully processed.
  - `url` (_String_): The absolute url of the input, allowing circular reference detection and nested transclusion.

__Examples__

```javascript
import { trancludeFile, resolveHttpUrl, resolveLocalUrl, resolveString } from 'hercule';

function myResolver(url, source, placeholder) {
  // Add your implementation here
  // Return null to try next resolver
  return null;
}

// Resolvers are tried in order
const resolvers = [myResolver, resolveHttpUrl, resolveLocalUrl, resolveString];

trancludeFile('foo.md', { resolvers }, (err, output) => {
  // Handle exceptions like dead links
  if (err) console.log(err)
  console.log(output);
});
```

---------------------------------------

<a name="customSyntax" />

### Custom Transclusion Syntax

Hercule also has basic support for alternative transclusion link syntax, including:

- [aglio](https://github.com/danielgtaylor/aglio/): `<!-- include(foo.md) -->`
- [Marked](http://marked2app.com/help/Multi-File_Documents.html): `<<[sections/section1.md]`
- [MultiMarkdown](http://fletcher.github.io/MultiMarkdown-5/transclusion.html): `{{bar.md}}`
