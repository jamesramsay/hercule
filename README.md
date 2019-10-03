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

Hercule is a command-line tool and library for transcluding markdown, [API Blueprint](http://apiblueprint.org), and plain text. This allows complex and repetitive documents to be written as smaller logical documents, for improved consistency, reuse, and separation of concerns.

- Extends markdown link syntax with preceding colon `:` (e.g. `:[Title](link.md)`)
- Transclude local and remote (HTTP) files
- Smart indentation

## Contents

- [Usage](#usage)
- [Syntax](#syntax)
- [API](#api)

## Usage

Install Hercule using [npm](http://npmjs.org):

```console
$ npm install -g hercule
```

Use Hercule as a command-line utility:

```console
$ hercule src/blueprint.md -o output.md
```

Or, use Hercule as a library:

```javascript
import { transcludeString } from 'hercule';

transcludeString('# Title\n\n:[abstract](abstract.md)', (err, output) => {
  if (err) console.log(err)
  console.log(output);
});
```

## Syntax

Hercule extends the Markdown inline link syntax with a leading colon (`:`) to denote the link should be transcluded. The content of the linked file will replace the transclusion link including nested transclusion links.

```markdown
The :[subject of sentence](fox.md) jumps over :[observer](dog.md).
```

Markdown renderers ignore the leading colon and render transclusion links as HTML links with a preceding colon.

**Example 1: transclusion link**

Prepend a colon (`:`) to a markdown link to transclude the files' content. Unauthenticated HTTP/S transclusion is also supported (e.g. `:[example link](https://foo.com/bar.md`).

<table>
<thead><tr>
<th align="left">Input</th>
<th align="left">Output (<code>$ hercule input.md</code>)</th>
</tr></thead>
<tbody><tr>
<td align="left">input.md:
<pre>This is an :[example link](foo.md).</pre>
</td>
<td align="left" rowspan="2">
<pre>This is an example transclusion.</pre>
</td>
</tr>
<tr>
<td align="left">foo.md:
<pre>example transclusion</pre>
</td>
</tr>
</tbody>
</table>

**Example 2: whitespace sensitivity**

Leading whitespace is significant in Markdown. Hercule preserves whitespace when a transclusion link is preceded with only whitespace by indenting each line of the transcluded file.

Each line of `currency-usd.json` is indented with the whitespace preceding the transclusion link, where the transclusion link is preceded only by whitespace.

<table>
<thead><tr>
<th align="left">Input</th>
<th align="left">Output (<code>$ hercule input.md</code>)</th>
</tr></thead>
<tbody><tr>
<td align="left">input.md:
<pre>
Currency object:<br><br>
  :\[](currency-usd.json)
</pre>
</td>
<td align="left" rowspan="2">
<pre>
Currency object:<br><br>
  {
    "code": "USD",
    "currency": "United States dollar"
  }
</pre>
</td>
</tr>
<tr>
<td align="left">currency-usd.json:
<pre>
{
  "code": "USD",
  "currency": "United States dollar"
}
</pre>
</td>
</tr>
</tbody>
</table>

**Example 3: passing context**

Context can be passed through transclusion links to nested (descendent) transclusion links, and is passed by adding override arguments to the transclusion link and is scoped to the linked file and its descendants.

Each override is denoted by a target link and an overriding link (e.g. `:[](foo.md BING:bar.md)`). The target link and overriding link are separated by a colon. The overriding link will override all descendant links that match the target link. The overriding link may also be a double quoted string (e.g. `:[](foo.md BOP:"fizz buzz"`).

It is clearest for overrides to use a simple string for the target link that will not be confused for a real file path.

The transclusion link `:[](CODE)` in `payment-terms.md` is targeted by the override in `input.md`.

<table>
<thead><tr>
<th align="left">Input</th>
<th align="left">Output (<code>$ hercule input.md</code>)</th>
</tr></thead>
<tbody><tr>
<td align="left">input.md:
<pre># Payment Terms<br><br>
:[](payment-terms.md CODE:"USD")</pre>
</td>
<td align="left" rowspan="2">
<pre># Payment Terms<br><br>
Payment shall be made via direct
deposit in USD.</pre>
</td>
</tr>
<tr>
<td align="left">payment-terms.md:
<pre>Payment shall be made via direct
deposit in :[](CODE).</pre>
</td>
</tr>
</tbody>
</table>

**Example 4: default**

A link or a string can also be specified as a default when no override is supplied.

The default must immediately follow the link, is denoted by the double vertical bar (`||`) and may be followed by additional overrides (e.g. `:[](FOO || bar.md FIZZ:buzz.md BING:"bop")`.

<table>
<thead><tr>
<th align="left">Input</th>
<th align="left">Output (<code>$ hercule input.md</code>)</th>
</tr></thead>
<tbody><tr>
<td align="left">input.md:
<pre># Payment Terms<br><br>
:[](payment-terms.md)</pre>
</td>
<td align="left" rowspan="2">
<pre># Payment Terms<br><br>
Payment shall be made via direct
deposit in GBP.</pre>
</td>
</tr>
<tr>
<td align="left">payment-terms.md:
<pre>Payment shall be made via direct
deposit in :[](CODE || "GBP").</pre>
</td>
</tr>
</tbody>
</table>

## API

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

const transcluder = new TranscludeStream();

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
import { transcludeString } from 'hercule';

transcludeString(':[foo](bar.md)', (err, output) => {
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
import { transcludeFile } from 'hercule';

transcludeFile('foo.md', (err, output) => {
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

__Returns__

- (_null_): Returns null if the url cannot be resolved.
- (_Object_)
  - `content` (_Stream | String_): The content to be transcluded. Streams are processed for further transclusion links. Strings are assumed fully processed.
  - `url` (_String_): The absolute url of the input, allowing circular reference detection and nested transclusion.

__Examples__

```javascript
import { transcludeFile, resolveHttpUrl, resolveLocalUrl, resolveString } from 'hercule';

function myResolver(url, source) {
  // Add your implementation here
  // Return null to try next resolver
  return null;
}

// Resolvers are tried in order
const resolvers = [myResolver, resolveHttpUrl, resolveLocalUrl, resolveString];

transcludeFile('foo.md', { resolvers }, (err, output) => {
  // Handle exceptions like dead links
  if (err) console.log(err)
  console.log(output);
});
```
