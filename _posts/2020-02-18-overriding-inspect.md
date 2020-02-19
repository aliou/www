---
layout: post
title: Changing perception of objects by overriding the inspect method
description: >
  TBD
tags: [ruby, rails]
---

While writing my [previous post][], I realized that while using the attributes API allows us to avoid making mistakes when instantiating our value objects, it might not entirely convey that there's a limited number of objects that can be instantiated [^1].

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

Let's start by defining constants for each of our values. Under the `initialize` method [^2], let's create the constants using [`const_set`][] and a bit of metaprogramming:

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

As we can see above, by default, `inspect` returns the class name, a representation of the memory address of the object and a list of instance variables of the object.

In our case, we want `inspect` to instead display how the object should be accessed. This means making it look like the constants we've created above:

```ruby
class Shift::Category
  # ...

  def inspect
    "#{self.class}::#{raw_category.upcase}"
  end
end
```

With this, the value object is now displayed as a constant when inspecting the object or in logs:

```ruby
# Before we had:
pry(main)> Ship::Category::SHUTTLE
# => #<Ship::Category:0x00007fbddc853350 @raw_category="shuttle">

# Now we have
pry(main)> Ship::Category::SHUTTLE
# => Ship::Category::SHUTTLE
```

<!-- As I write this, I realize that this might be one of those time where Ruby allows you to do -->

----

Besides indulging in my whims, there are other interesting reasons to override inspect:
- This is useful to hide sensitive values like emails or encrypted passwords, as [Devise does it][devise].
- Since Rails 6, you can [configure ActiveRecord to filter attributes from inspection][rails-pr]. This is also done by [overriding the `inspect` method][activerecord-inspect].
- The `IPAddr` class also [overrides the inspect method][ipaddr] to display a human readable representation of the IP address.

[devise]: https://github.com/heartcombo/devise/blob/v4.7.1/lib/devise/models/authenticatable.rb#L120-L125
[rails-pr]: https://github.com/rails/rails/pull/33756/files
[activerecord-inspect]: https://github.com/rails/rails/pull/33756
[ipaddr]: https://github.com/ruby/ruby/blob/v2_7_0/lib/ipaddr.rb#L457-L468

<small>The code examples in this post are also available [on GitHub](https://github.com/aliou/ships-category){:target="blank"}.
Thanks to <a href='https://twitter.com/caouibachir' target="_blank">Bachir Çaoui</a> and Stéphanie Chhim for reviewing a draft version of this post.</small>


---

[^1]: Of course, we could look at the file defining the constants, but where would be the fun in that?

[^2]: Because our constants are set directly in the class, the `new` method needs to be already defined, hence defining them under the initialize method.

