---
layout: post
title: Postgres timestamp ranges in Ecto
description: Making a custom `Ecto.Type` to use a native Postgres type
---

Let’s say we need to schedule chores between different members of a team in a spaceship. [^1]

The simplest way to do this would be to store the period of our chore and who is
assigned to it. With Ecto, the migration creating this table would look like this:

```elixir
create table(:chores) do
  add(:user_id, references("users"), null: false)
  add(:note, :string)
  add(:period, :tsrange)

  timestamps(default: fragment("NOW()"))
end
```

We also need to make sure a user can't have multiple chores overlapping with
each other. For this we'll add add [an exclusion constraint][] on our period:

```elixir
# Add the btree_gist extension to allow using `gist` indexes
# with scalar types, in our case the `user_id`.
execute("CREATE EXTENSION btree_gist")

create(
  constraint(
    "chores",
    :no_overlaping_chores_for_user,
    exclude: ~s|gist (user_id with =, period with &&)|
  )
)
```

### Creating the schema

We now create our schema representing a Chore in the application. Let's try to
use the `:tsrange` as the type of our chore period:

```elixir
defmodule Chore do
  use Ecto.Schema

  schema "chores" do
    field(:note, :string)
    field(:period, :tsrange)

    belongs_to(:user, User)

    timestamps()
  end
end
```

Trying to compile this, we have an error:
```
== Compilation error in file lib/chore.ex ==
** (ArgumentError) invalid or unknown type :tsrange
    for field :period
```

Because `:tsrange` is not a type known by Ecto, we need to create our own type
following the [`Ecto.Type` behaviour][ecto-type-behaviour]{:target="_blank"}.
But first we'll create a struct that represents a timestamp range.

### Creating a struct representing a range

We'll store the informations needed by Postgres to create the range:

We define our `Timestamp.Range` as a struct with the first and last elements of the
range and with options for the inclusivity of those elements in the range.

<!--
We allow `nil` values to represent the lack of first and last elements: an
infinite range.
-->

```elixir
defmodule Timestamp.Range do
  defstruct [:first, :last, opts: []]

  @type t :: %__MODULE__{
          first: NaiveDateTime.t(),
          last: NaiveDateTime.t(),
          opts: [
            lower_inclusive: boolean(),
            upper_inclusive: boolean()
          ]
        }
end
```

We also define a convenience function to create a `Timestamp.Range`:

```elixir

@default_opts [lower_inclusive: true, upper_inclusive: false]

@spec new(NaiveDateTime.t(), NaiveDateTime.t(), Keyword.t()) :: t
def new(first, last, opts \\ []) do
    opts = Keyword.merge(@default_opts, opts)

    %__MODULE__{
      first: first,
      last: last,
      opts: opts
    }
end
```

We can now represent a Postgres's `tsrange` in Elixir.

### Implementing the `Ecto.Type` behaviour
The `Ecto.Type` behaviour expects four functions to be defined:
- `type/0`: The underlying type of our custom type, known by either Ecto, or
    <a href='https://github.com/elixir-ecto/postgrex' target='_blank'>Postgrex</a>
- `cast/1`: A function to transform anything into our custom type.
- `load/1`: A function to transform something from the database into our custom
    type.
- `dump/1`: A function to transform our custom type into something understood by
    the database.

The `type` implementation is straightforward:
```elixir
def type, do: :tsrange
```

The `cast` implementation is also straightforward: we only allow the custom type
to be cast:
```elixir
def cast(%Timestamp.Range{} = range), do: {:ok, range}
def cast(_), do: :error
```

The `load` implementation receives a `Postgrex.Range` and transforms it to a
`Timestamp.Range`:
```elixir
def load(%Postgrex.Range{} = range) do
  {:ok,
    Timestamp.Range.new(
      range.lower,
      range.upper,
      lower_inclusive: range.lower_inclusive,
      upper_inclusive: range.upper_inclusive
    )}
end

def load(_), do: :error
```

And finally, the `dump` implementation takes a `Timestamp.Range` and transforms
it to a `Postgrex.Range`:
```elixir
def dump(%Timestamp.Range{} = range) do
  [lower_inclusive: lower_inclusive, upper_inclusive: upper_inclusive] = range.opts

  {:ok,
    %Postgrex.Range{
      lower: range.first,
      upper: range.last,
      lower_inclusive: lower_inclusive,
      upper_inclusive: upper_inclusive
    }}
end

def dump(_), do: :error
```

### Using in the schema
Now that we have our custom Ecto type, we can use it in our schema:

```elixir
schema "chores" do
  field(:note, :string)
  field(:period, Timestamp.Range)

  belongs_to(:user, User)

  timestamps()
end
```

And now our project compiles properly!

##### TODO: Conclusion about having custom types to take advantage of Postgres cool types.

#### Further reading
- Documentation on the [`Ecto.Type` behaviour](https://hexdocs.pm/ecto/2.2.10/Ecto.Type.html){:target="_blank"}
- Documentation on [Postgres' range types](https://www.postgresql.org/docs/10/static/rangetypes.html){:target="_blank"}
- More reading on [Postgres' range types](https://tapoueh.org/blog/2018/04/postgresql-data-types-ranges){:target="_blank"}

[^1]: If you know me this [might be familiar][snapshift]{:target="_blank"}.
<!-- [^2]: This example uses Ecto 3.0 so `PostgrexRange` uses `NaiveDateTime` instead of the deprecated type `Postgrex.DateTime`. -->
[snapshift]: https://www.snapshift.co
[ecto-type-behaviour]: https://hexdocs.pm/ecto/2.2.10/Ecto.Type.html
[Postgrex]: https://github.com/elixir-ecto/postgrex
[an exclusion constraint]: https://www.postgresql.org/docs/current/static/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
