---
layout: post
title: Three ways to ignore files in Git
description: >
  There are different ways to ignore files in a Git repository, each
  with their own uses.
tags: [git, tools, til]
---

TIL I learned that their are different ways to ignore files in Git:

### 1. Using a `.gitignore` file in a repository
When created in a Git repository, this `.gitignore` is only applied to the
directory it is in and its children. This means that you can ignore files in the
whole repository and also ignore some files in some subdirectories.

Start by creating a `.gitignore` in a subdirectory:

```sh
# lib/.gitignore
*.md
```

With the following directory structure:

```sh
.
├── lib
│   ├── .gitignore
│   ├── todo.md        # <- Will be ignored
└── Readme.md          # <- Will not be ignored
```

This file should be version-controlled and includes files that all developers working on the repository will want to ignore.

### 2. Using the local exclusion file `.git/info/exclude`

Start by creating the `info` directory and the exclude file in our repository
`.git` directory:
```sh
mkdir -p .git/info
touch exclude
```

Then you can add files or pattern of files you want to ignore:
```
TODO.md
NOTES.txt
```

I mainly use it to ignore files that do not need to be shared with other developers.
I usually leave notes a list of TODOs at the root of a project and ignore them in this file.

### 3. Using a global `.gitignore`

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

I use it to ignore file I never want to be committed, e.g. backup or temporary
files, build  artifacts, etc.

-----

#### Further reading
- Documentation for [`gitignore`](https://git-scm.com/docs/gitignore){:target="_blank"}.
