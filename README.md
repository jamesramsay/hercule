# Hercule – Markdown Transclusion Tool

[![Version](https://img.shields.io/npm/v/hercule.svg)](https://npmjs.com/package/hercule)
[![License](https://img.shields.io/npm/l/hercule.svg)](https://npmjs.com/package/hercule)
[![Build Status](https://img.shields.io/travis/jamesramsay/hercule.svg)](https://travis-ci.org/jamesramsay/hercule)
[![Coverage Status](https://img.shields.io/codecov/c/github/jamesramsay/hercule.svg)](https://codecov.io/github/jamesramsay/hercule)
[![Dependency Status](https://img.shields.io/david/jamesramsay/hercule.svg)](https://david-dm.org/jamesramsay/hercule)

![Hercule](hercule.png)

Write large markdown documents, including [API Blueprint](http://apiblueprint.org), while keeping things DRY (don't repeat yourself).

Hercule is a command-line tool and library for transcluding markdown, [API Blueprint](http://apiblueprint.org), and plaintext. This allows complex and repetitive documents to be written as smaller logical documents, for improved consistency, reuse, and separation of concerns.

- Simple extension of markdown link syntax `:[Title](link.md)` (preceeding colon `:`)
- Transclude local files
- Transclude remote (HTTP) files
- Transclude strings
- Smart indentation
- Stream, Async, Sync APIs

-----

[![Adslot](adslot.png)](http://adslot.com/)

Hercule is used by [Adslot](http://adslot.com) to help document our APIs in [API Blueprint](http://apiblueprint.org) more efficiently and more accurately. We also use [Apiary](http://apiary.io) to distribute our API documentation and [DREDD](https://github.com/apiaryio/dredd) (a tool by [Apiary](http://apiary.io)) to validate the documentation against implementation.

-----

## Installation

You can install Hercule using [npm](http://npmjs.org):

```bash
npm install -g hercule
```

## Usage

You can use Hercule as a command-line utility:

```bash
hercule src/blueprint.md -o output.md
```

Hercule supports processing input from stdin, and writing to stdout:

```
cat src/blueprint.md | hercule | less
```

Or you can use Hercule as a library:

```javascript
var hercule = require('hercule');

var output = hercule.transcludeStringSync("# Title\n\n:[abstract](abstract.md)");
console.log(output);
```

Following examples use ES2015 syntax.

## Transclusion Syntax

### Basic transclusion (local files and remote HTTP files)

Hercule extends the Markdown inline link syntax with a leading colon (`:`) to denote the link should transcluded.


```javascript
import {transcludeStringSync} from 'hercule';

const input = 'This is an :[example link](foo.md).';

const output = transcludeStringSync(input);
console.log(output);
// This is an example transclusion.
```

Extending the standard Markdown link syntax means most markdown parsers will treat Hercule's transclusion links as standard Markdown links.
For example, Github handles transclusion links in this manner.

Hercule is also able to transclude HTTP links.

```javascript
import {transcludeStringSync} from 'hercule';

const input = 'Jackdaws love my :[size](https://raw.githubusercontent.com/jamesramsay/hercule/master/test/fixtures/basic/size.md) sphinx of quartz.';

const output = hercule.transcludeStringSync(input);
console.log(output);
// Jackdaws love my big sphinx of quartz.
```

### Placeholders and overriding references

Placeholders (e.g. `:[foo](bar)`) allow you create a target for transclusion without specifying the link in the document.
A parent document can then override the placeholder with the desired link.

Placeholders and references can be helpful for increasing the _'dryness'_ of your source documents,
or allowing environmental variables to be passed into the document during processing.

```javascript
import {transcludeStringSync} from 'hercule';

const input = ':[foo](bar)';
const options = {
  references: [{
    placeholder: 'bar',
    href: 'fizz buzz',
    hrefType: 'string'
  }]
};

const output = transcludeStringSync(input, options);
console.log(output);
// fizz buzz
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
import {transcludeStringSync} from 'hercule';

const inputRequired = ':[Required Ingredient](cucmber.mson required:"required")';
const inputDefault = ':[Optional Ingredient](cucmber.mson)';

const outputRequired = transcludeStringSync(inputRequired);
console.log(outputRequired);
// ## Recipe (object)
//
// - id: 1 (number, required)
// - name: Cucumber (string, required)
// - description: Essential for tzatziki (string, required)

const outputDefault = transcludeStringSync(inputDefault);
console.log(outputDefault);
// ## Recipe (object)
//
// - id: 1 (number, required)
// - name: Cucumber (string, required)
// - description: Essential for tzatziki (string, optional)
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

Some functions are available in both sync and async varieties.

- [`transclude`](#transclude)
- [`transcludeString`](#transcludeString), `transcludeStringSync`
- [`transcludeFile`](#transcludeFile), `transcludeFileSync`

Note synchronous interfaces rely on [`execFileSync`](https://nodejs.org/api/child_process.html#child_process_child_process_execfilesync_file_args_options) which is only available with node 0.12 and above.
Async interfaces should work with node 0.10 and above.

---------------------------------------

<a name="transclude" />

### transcludeStream([options])

Returns a duplex stream.

__Arguments__

- `options` - An object of options to be applied when processing input.
  - `relativePath` - A path to which the transclusion links within input stream are relative.
  - `references` - A collection of references which be considered when resolving each transclusion link.
    Each reference must contain `placeholder`, `href`, and `hrefType`.
    - `placeholder` - A string used to locate the target(s) for transclusion.
    - `href` - A link which will be trancluded according to its `hrefType`.
    - `hrefType` - `file`, `http`, or `string`
  - `parents` - A collection of fully qualified file paths of the input used to detect and prevent circular transclusion.

__Examples__

```javascript
import {trancludeStream} from 'hercule';

const trancluder = new trancludeStream();

// assuming input is a readable stream and output is a writable stream
input.pipe(transcluder).pipe(output);
```

---------------------------------------

<a name="transcludeString" />

### transcludeString(str, [options], callback)

Transcludes the input `str`, and `callback` is called when finished.

__Arguments__

- `str` - A string to process.
- `options` - An object of options to be applied when processing input.
  - `relativePath` - A path to which the transclusion links within input `str` are relative.
- `callback(err, [output])` - A callback which is called after the file at the provided `filepath`
  has been processed. `callback` will be passed an error and the processed output.

Omit the callback if using `transcludeStringSync`.

__Examples__

```javascript
// async
import {trancludeString} from 'hercule';

// TODO

```

```javascript
// sync
import {trancludeStringSync} from 'hercule';

// TODO

```

---------------------------------------

<a name="transcludeFile" />

### transcludeFile(filepath, [options], callback)

Transcludes the file at the provided `filepath`, and `callback` is called when finished.

__Arguments__

- `filepath` - A path to a file to process.
- `options` - An object of options to be applied when processing input.
  - `relativePath` - A path to which the input `filepath` is relative.
- `callback(err, [output])` - A callback which is called after the file at the provided `filepath`
  has been processed. `callback` will be passed an error and the processed output.

Omit the callback if using `transcludeFileSync`.

__Examples__

```javascript
// async
import {trancludeFile} from 'hercule';

// TODO

```

```javascript
// sync
import {trancludeFileSync} from 'hercule';

// TODO

```
