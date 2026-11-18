# ExtremeXOS for Visual Studio Code

Syntax highlighting for ExtremeXOS configuration exports and CLI command lists. Use `.exos` for new files. VS Code also recognizes `.exosconfig` and `.extremexos`.

In the Markdown editor, put `exos` directly after the opening fence.

~~~markdown
```exos
# Configure an example VLAN
create vlan "Example"
configure vlan "Example" tag 100
enable vlan "Example"
```
~~~

The fence aliases `exosconfig` and `extremexos` also work. The editor accepts `language=exosconfig` as well. Use the bare `exos` fence for Markdown files shared across editors.

## Install from source

Run `npx @vscode/vsce package` from this directory. In VS Code, open the Command Palette and choose **Extensions: Install from VSIX...**, then select the generated package.

The TextMate grammar derives verbs, topics, and known subcommand keywords from the generated Tree-sitter grammar. After changing parser rules, run `npm run generate` at the repository root, then run it again in this directory to update the highlighting grammar. Packaging also refreshes the highlighting grammar.
