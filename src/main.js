/**
 * Hercule
 * A simple markdown transclusion tool
 * Author: James Ramsay
 */

import fs from 'fs';
import path from 'path';
import meow from 'meow';
import { TranscludeStream } from './hercule';

const cli = meow(
  `Usage:
  $ hercule [<input> ...]

Options:
  --stdin                    Specifies input to be read from stdin.
  --output, -o path          Specifies the name and location of the output file.  If not specified, stdout is used.
  --syntax, -s syntax_name   Specifies which transclusion link syntax (e.g. hercule, aglio, marked, multimarkdown).
                             If not specifed, hercule is used.
  --relative, -r path        Specifies the path to which links in input are relative.
  --sourcemap, -m            Specifies a sourcemap should be gnerated. Only used if output is specified.

Examples:
  $ hercule foo.md
    Processes the file foo.md and prints to stdout
  $ cat foo.md | hercule - --output bar.md
    Processes the input from stdin and writes output to bar.md
  `,
  {
    flags: {
      output: {
        type: 'string',
        alias: 'o',
      },
      syntax: {
        type: 'string',
        alias: 's',
        default: 'hercule',
      },
      relative: {
        type: 'string',
        alias: 'r',
        default: '',
      },
      sourcemap: {
        type: 'boolean',
        alias: 'm',
      },
      stdin: {
        type: 'boolean',
      },
    },
  }
);

if (cli.input.length === 0 && !cli.flags.stdin) {
  process.stderr.write('\nNo input specified.\n');
  cli.showHelp();
}

let inputStream;
let source;
const options = { transclusionSyntax: cli.flags.syntax };
const input = cli.input[0];

if (input) {
  // Reading input from file
  source = path.normalize(input);
  inputStream = fs.createReadStream(source, { encoding: 'utf8' });
} else {
  // Reading from stdin
  source = path.join(cli.flags.relative, 'stdin');
  inputStream = process.stdin;
}

const outputStream = cli.flags.output
  ? fs.createWriteStream(cli.flags.output, { encoding: 'utf8' })
  : process.stdout;
options.outputFile = cli.flags.output || 'stdout';

const transclude = new TranscludeStream(source, options);

inputStream.on('error', err => {
  process.stderr.write(`\n\n${err.message} (${err.path})\n`);
  process.exit(1);
});

transclude.on('error', err => {
  process.stderr.write(`\n\nERROR: ${err.message} (${err.path})\n`);
  process.exit(1);
});

transclude.on('sourcemap', sourcemap => {
  const sourcemapFilepath = `${cli.flags.output}.map`;
  if (cli.flags.sourcemap && cli.flags.output)
    fs.writeFileSync(sourcemapFilepath, `${JSON.stringify(sourcemap)}\n`);
});

inputStream.pipe(transclude).pipe(outputStream);
