# ExtremeXOS for Visual Studio Code

Syntax highlighting for ExtremeXOS configuration exports and CLI command lists. Use `.exos` for new files. VS Code also recognizes `.exosconfig` and `.extremexos`.

## Markdown

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

## Installation

In the VS Code Extensions view, search for `@id:aaronaxvig.extremexos` and select **Install**. If you downloaded a release VSIX, open the Command Palette and choose **Extensions: Install from VSIX...**.
