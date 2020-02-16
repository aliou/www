---
layout: post
title: Changing perception of value objects by overriding inspect
description: >
  TBD
tags: [ruby, rails]
---

<!-- introduction about thinking about this while writing the previous post -->
While writing my [previous post][], I realized that while using the attributes API allows us to avoid making mistakes when instantiating our value objects, it might not entirely convey that there's a limited number of objects that should be instantiated.

To this end, I thought about a way to prevent this: let's pretend that our value objects are constants.

[previous post]: /2019/10/attributes-api-and-value-objects/

---

## Generating constants

First, let's take our `Ship::Category` from the previous post:

```ruby
class Ship::Category
  VALID_CATEGORIES = %w(
    shuttle supply_carrier troop_carrier war_ship
  ).freeze

  def initialize(category)
    raise "invalid category: #{category.inspect}" unless category.in?(VALID_CATEGORIES)

    @raw_category = category
  end

  def to_s
    raw_category
  end

  private

  attr_reader :raw_category
end
```

Let's start by defining constants for each of our values. Under the `initialize` method, let's create constants using [`const_set`][]:

```ruby
class Shift::Category
  # ...

  VALID_CATEGORIES.each do |raw_category|
    const_set(raw_category.upcase, new(raw_category))
  end
end
```

[`const_set`]: https://www.rubydoc.info/stdlib/core/Module:const_set

Calling [`Ship::Category.constants`][] show us that our constants have correctly been created:

```ruby
pry(main)> Ship::Category.constants
# => [:WAR_SHIP, :TROOP_CARRIER, :SHUTTLE, :SUPPLY_CARRIER, :VALID_CATEGORIES]
```

[`Ship::Category.constants`]: https://www.rubydoc.info/stdlib/core/Module:constants

However, inspecting the constant reveals our trickery:

```ruby
pry(main)> Ship::Category::SHUTTLE
# => #<Ship::Category:0x00007fbddc853350 @raw_category="shuttle">
```

So, how do we really pretend that our `Ship::Category` object is truly a constant ? We can do this by overriding the [`inspect`][] method:

[`inspect`]: https://www.rubydoc.info/stdlib/core/Object:inspect

## Overriding inspect

As we can see above, by default, `inspect` returns the class name, an representation of the memory address of the object and a list of instance variable of the object.
 
In our case, we want `inspect` to instead display how the object should be accessed. This means making it look like the constants we've created above.


```ruby
class Shift::Category
  # ...

  def inspect
    "#{self.class}::#{raw_category.upcase}"
  end
end
```

With this, the value object is now displayed as a constant when inspecting the object or in logs:

```
# Before we had:
pry(main)> Ship::Category::SHUTTLE
=> #<Ship::Category:0x00007fbddc853350 @raw_category="shuttle">

# Now we have
pry(main)> Ship::Category::SHUTTLE
=> Ship::Category::SHUTTLE

```

TODO: Conclusion about how this might be one of those times where ruby allow you to go too far.

----

TODO: List other reasons to override the inspect method:
- Hiding sensitive values (how devise does it), how rails now does it since rails 6 with `filter_attributes`.
- Better pretty printing of values in logs and in the console.


TODO: Repo with code examples : <https://github.com/aliou/ships-category>





















