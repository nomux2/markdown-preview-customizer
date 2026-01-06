# VSIX Package Command

To create a VSIX package for the extension, run the following command:

```bash
npx vsce package
```

This will generate a `.vsix` file in the current directory.

# Version Update

To update the version (bump version in package.json and create git tag):

```bash
# Patch (0.0.1 -> 0.0.2)
npm version patch

# Minor (0.1.0 -> 0.2.0)
npm version minor

# Major (1.0.0 -> 2.0.0)
npm version major
```

> [!IMPORTANT]
> `npm version` requires a clean git working directory. Please commit or stash your changes before running these commands.

