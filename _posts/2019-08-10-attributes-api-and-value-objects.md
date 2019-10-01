---
layout: post
title: Using Rails's Attributes API to serialize Value Objects
description: >
  How the Rails's Attributes API allows you to use value object in association with your models.
image: https://img.aliou.me/blog/spacex-falcon-9-rocket.jpg
tags: [rails]
---

Continuing my deep dive into Rails features [^1], I recently read about the [Attributes API][attributes-api-docs]{:target="_blank"} and
more particularly about how it can be used with custom types.

[attributes-api-docs]: https://api.rubyonrails.org/classes/ActiveRecord/Attributes/ClassMethods.html

### The `attribute` API

The `attributes` method allows you to define an attribute with a type on a model. This type can be a completely custom.  

In our example, we have spaceships that are defined by their category. Those categories are both immutable and interchangeable, and are good candidates to be transformed into [value objects][value-objects]{:target="_blank"}.

[value-objects]: https://www.martinfowler.com/bliki/ValueObject.html

Our current model looks like this:

```ruby
# app/models/ship.rb
class Ship < ApplicationRecord
  validates :name, presence: true
  validates :category, presence: true

  validates :category, inclusion: { in: Ship::Category::VALID_CATEGORIES }
end
```

And our `Ship::Category` value type looks like this:
```ruby
# app/models/ship/category.rb
class Ship::Category
  VALID_CATEGORIES = %w(
    shuttle supply_carrier troop_carrier war_ship
  ).freeze

  def initialize(category)
    raise "invalid category '#{category.inspect}'" unless category.in?(VALID_CATEGORIES)

    @raw_category = category
  end

  def to_s
    raw_category
  end

  # Conform to comparable.
  def <=>(other)
    VALID_CATEGORIES.index(to_s) <=> VALID_CATEGORIES.index(other.to_s)
  end

  private

  attr_reader :raw_category
end
```

Now, let's update our model to retrieve our value object:
```ruby
# app/models/ship.rb
class Ship < ApplicationRecord
  # ...

  def category
    @category ||= Ship::Category.new(self[:category])
  end
end
```

While this does what we want, this can be improved by creating a custom type.

### Creating a custom type
We create our custom type by inheriting from `ActiveRecord::Type::Value` and overriding the necessary methods:
- `type` is the type of our object when saved in the database. In our case this will be `:string`.
- `cast` is the method called by ActiveRecord when setting the attribute in the model.
In our case, we will instantiate our value object.
- `deserialize` converts the value from the database to our value object. By default it calls `cast`.
- `serialize` converts our value object to a type that the database understands. In our case, we'll send back the string containing the raw category.

For our type it looks like this:
```ruby
# app/types/ship_category.rb

class CategoryType < ActiveRecord::Type::Value
  def type
    :string
  end

  def cast(value)
    Ship::Category.new(value)
  end

  def deserialize(value)
    cast(value)
  end

  def serialize(value)
    value.to_s
  end
end
```

### Registering our type

Now that our type is created, we need to register it so ActiveRecord knows about it:

```ruby
# config/initializers/types.rb
ActiveRecord::Type.register(:ship_category, CategoryType)
```
<small class='ma0'>You will need to restart your Rails server or re-register your type every time you update it.</small>

### Using it in our model
Finally, we can use it in our model:
```ruby
class Ship < ApplicationRecord
  attribute :category, :ship_category

  validates :name, presence: true
  validates :category, presence: true
end
```

---

At this point, you might be wondering: *Why would I do this?*
Personally, I feel like it is *cleaner* to let Rails handle the instantiation of objects instead of the usual memoization-with-instance-variables dance.

Furthermore, it allows you to add additional features to your model without having pollute the model class. In our case, we allow our ships to be compared based on their categories by implementing [Comparable][]{:target="_blank"} in our Category.

[Comparable]: https://ruby-doc.org/core/Comparable.html

However, there are ways to make this particular use case fall down. In our example above, we limit the category to the values defined in `VALID_CATEGORIES`. This means that creating a row in our database with a value that isn't valid will make our application raise when trying to instantiate the row into a `Ship` object:

```sql
INSERT INTO ships(id, name, category, created_at, updated_at)
VALUES (10, 'USS Enterprise', 'interstellar_liner', NOW(), NOW());
```

```ruby
enterprise = Ship.find(10)
# => Error: invalid category 'interstellar_liner'
```

For the purpose of this blog post, I chose a fairly simple example to present the attributes API.
To achieve a similar result, you could also define the categories as a ActiveRecord Enum, as a Postgres Enum[^2] or even have them in their own table and have a Postgres association between a Ship and its category, that is backed by a foreign Key to achieve integrity of your data.

[^1]: See my previous post about [Namespaced Rails validators](/posts/2018/08/namespaced-rails-validators/).
[^2]: However, this would require you to change your schema format to `:sql` or to override Rails's Schema dumper to handle Postgres Enums (But more on that in a future post).
