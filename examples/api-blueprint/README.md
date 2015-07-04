# Example: API Blueprint

Borrowing from the Apiary [Gist Fox Tutorial example](http://apiary.io/blueprint), API Blueprint documents can be split into logical files and share common elements.

This example uses a different file for `gists` and `gists/{id}`, and shares a common file `gist.json`.

```
$ hercule gist-fox.apib -o apiary.apib
```

Hercule accepts a single source file, in this example `gist-fox.apib`.

```markdown
FORMAT: 1A

# Gist Fox API
Gist Fox API is a **pastes service** similar to [GitHub's Gist](http://gist.github.com).

# Group Gist

:[Gist](blueprint/gist.md)

:[Gists](blueprint/gists.md)
```

Each resource is being stored in its own file, `gist.md` and `gists.md` respectively.

```markdown
## Gist [/gists/{id}]
A single Gist object.
The Gist resource is the central resource in the Gist Fox API.
It represents one paste - a single text note.

+ Parameters
  + id (string) ... ID of the Gist in the form of a hash.

+ Model

    + Body

      ```
      :[](gist.json)
      ```

### Retrieve a Single Gist [GET]

+ Response 200

  [Gist][]
```

The common JSON body is stored in `gist.json`.

```json
{
  "id": "42",
  "created_at": "2014-04-14T02:15:15Z",
  "description": "Description of Gist",
  "content": "String contents"
}
```

See `examples/api-bluprint` for a full example.
Use `hercule gist-fox.apib | snowcrash` to validate.
