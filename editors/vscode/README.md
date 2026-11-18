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

Run `npm ci` and `npm run package` from this directory. In VS Code, open the Command Palette and choose **Extensions: Install from VSIX...**, then select the generated package.

The TextMate grammar reads the same generated command rules as Tree-sitter. From the repository root, run `python3 -B -m tools.import_grammar /path/to/config/clidef` to include every available family in the extension. Then package the extension from this directory. Packaging refreshes the highlighting grammar directly from those rules.

Run `npm ci` and `npm test` in this directory to check script highlighting in standalone files and Markdown fences.

## GitHub releases

Pull requests and pushes to `main` check the generated highlighting and run the file and Markdown tests. To prepare a release, update the extension version and lockfile, commit, and push a matching tag (for example, `vscode-v1.0.1` for version `1.0.1`). The workflow packages that commit and attaches the VSIX to a draft GitHub Release. Install the attachment to check it, then publish the draft when ready.
