---
layout: post
title: Using Regexp named captures to extract data
description: >
  TBD
tags: [ruby]
---


For an internal project at work, I recently had to parse the name of a Heroku [review application][] to retrieve some data. The application name looked like this:

```
<project_name>-pr-<pull_request_id>
```

At first, since each part I needed was separated by a `-`, I had some code that looked like this:
```ruby
*project_name, _, pull_request_id = application_name.split('-')
project_name = project_name.join('-')
```

Because the project name could also have some `-` in it, I needed to rejoin it after extracting the pull request data.
At first, for a prototype, this worked fine. But when this internal project transitioned to being an important part of my team's tooling, I started looking at a better and cleaner way to achieve the same result.

Since we were already validating the format of the application name with a regular expression, I figured I'd use it to also retrieve the data using named captures.

## Regular expressions in Ruby

For a refresher on a regular expressions, I highly recommend [this article][][^1] by [Dan Eden][].

[this article]: https://daneden.me/2019/11/23/regex-for-designers-and-writers/
[Dan Eden]: https://daneden.me

As a reminder, there are multiple ways to create regular expressions in Ruby:
- Using `/xxxx/`
- Using `%r{}`
- Using `Regexp#new`

With your newly created regular expression, there are two main ways to check if a string matches a regular expression:

- Calling `String#match` with the regular expression as argument:
```ruby
'abc'.match(/a/)
# => #<MatchData "a">
```

- Calling `Regexp#match` on the regular expression with the string as argument:
```ruby
/a/.match('abc')
# => #<MatchData "a">
```

If the String matches the regular expression, it will return a [`MatchData`][] object. This object encapsulates the result of matching a String against a Regexp. It also contains the eventual captures and named captures.

## Named captures

Named captures allow you to describe submatches of a regular expression and then retrieve them from the resulting [`MatchData`][] object. In our case, our regular expression looked like this:

```ruby
/.*-pr-\d+/
```

To use named captures, we first need to add sub-matches to our regular expressions. Adding submatches is as simple as wrapping them inside parentheses:
```ruby
/(.*)-pr-(\d+)/
```

Finally, name the different captures. To do this, we need to prefix the content of the submatch with its name:

```ruby
/(?<project_name>.*)-pr-(?<pull_request_id>\d+)/
```

Now that we've done this, we can easily retrieve the data we want from the application name:

```ruby
application_name = 'my_app-pr-1234'
matches = /(?<project_name>.*)-pr-(?<pull_request_id>\d+)/.match(application_name)

matches[:project_name] # => 'my_app'
matches.named_captures # => {"project_name"=>"my_app", "pull_request_id"=>"1234"}
```


TODO: Conclusion and stuff

[review application]: https://devcenter.heroku.com/articles/github-integration-review-apps-old
[`MatchData`]: https://www.rubydoc.info/stdlib/core/MatchData

[^1]: While the article is intended for designers and UX writers, I found that it was an excellent introduction to regular expressions for everyone.

<!-- More links: -->
<!-- - https://www.rubyguides.com/2015/06/ruby-regex/ -->
<!-- - https://daneden.me/2019/11/23/regex-for-designers-and-writers/ -->
<!-- - http://ruby-for-beginners.rubymonstas.org/advanced/regular_expressions.html -->
<!-- - https://www.leighhalliday.com/named-captures-ruby-regular-expressions -->
