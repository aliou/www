---
layout: post
title: Namespaced Rails validators
description: How to namespace custom Rails validators
---

While going source spelunking, I came across this piece of code in Rails'
ActiveModel:

```ruby
key = "#{key.to_s.camelize}Validator"

begin
  validator = key.include?("::".freeze) ? key.constantize : const_get(key)
rescue NameError
  raise ArgumentError, "Unknown validator: '#{key}'"
end
```
<small>[`active_model/validations/validates.rb`][]{:target="_blank"}</small>
{: .ma0}

This means that you can namespace your custom validators:

```ruby
# lib/internal/email_validator.rb
module Internal
  class EmailValidator
    def validate_each(record, attribute, value)
      return if value.ends_with?('@private_domain.com')

      record.errors.add(attribute, 'not from private domain')
    end
  end
end
```

And then use them like this:

```ruby
# app/models/admin.rb
class Admin < ApplicationRecord
  validates :email, 'internal/email': true
end
```

[`active_model/validations/validates.rb`]: https://github.com/rails/rails/blob/v5.2.1/activemodel/lib/active_model/validations.rb

<small>Thanks to <a href='https://twitter.com/caouibachir' target="_blank">Bachir Çaoui</a> for reviewing a
draft version of this post.</small>
