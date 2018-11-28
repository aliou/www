---
layout: post
title: A global .gitignore
description: How to have a global gitignore that applies to all repos
tags: [git, tools]
---
A small tip that I've come across recently: It is possible to have a global `.gitignore` file
that applies to every Git repository on your machine.

Start by making a `.gitignore` file in your home directory,
with the files you want to ignore, and place in your home directory:

```sh
# ~/.gitignore

.vimrc.local
*.swp

.idea
.DS_Store
```

Then, tell Git to use this file as global `.gitignore` by running in your shell:

```sh
git config --global core.excludesfile ~/.gitignore
```

You can also take inspiration from my own
<a href='https://github.com/aliou/dotfiles/blob/master/git/gitignore' target='_blank'> global .gitignore file</a>. Enjoy!
