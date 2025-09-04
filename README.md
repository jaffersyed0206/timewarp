timewarp
=================

A developer CLI that lets you spin up your entire stack — frontend, backend, and databases — exactly as it existed at a specific point in time.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/timewarp.svg)](https://npmjs.org/package/timewarp)
[![Downloads/week](https://img.shields.io/npm/dw/timewarp.svg)](https://npmjs.org/package/timewarp)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g timewarp
$ timewarp COMMAND
running command...
$ timewarp (--version)
timewarp/0.0.0 darwin-arm64 node-v23.9.0
$ timewarp --help [COMMAND]
USAGE
  $ timewarp COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`timewarp hello PERSON`](#timewarp-hello-person)
* [`timewarp hello world`](#timewarp-hello-world)
* [`timewarp help [COMMAND]`](#timewarp-help-command)
* [`timewarp plugins`](#timewarp-plugins)
* [`timewarp plugins add PLUGIN`](#timewarp-plugins-add-plugin)
* [`timewarp plugins:inspect PLUGIN...`](#timewarp-pluginsinspect-plugin)
* [`timewarp plugins install PLUGIN`](#timewarp-plugins-install-plugin)
* [`timewarp plugins link PATH`](#timewarp-plugins-link-path)
* [`timewarp plugins remove [PLUGIN]`](#timewarp-plugins-remove-plugin)
* [`timewarp plugins reset`](#timewarp-plugins-reset)
* [`timewarp plugins uninstall [PLUGIN]`](#timewarp-plugins-uninstall-plugin)
* [`timewarp plugins unlink [PLUGIN]`](#timewarp-plugins-unlink-plugin)
* [`timewarp plugins update`](#timewarp-plugins-update)

## `timewarp hello PERSON`

Say hello

```
USAGE
  $ timewarp hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ timewarp hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/jaffersyed0206/timewarp/timewarp/blob/v0.0.0/src/commands/hello/index.ts)_

## `timewarp hello world`

Say hello world

```
USAGE
  $ timewarp hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ timewarp hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/jaffersyed0206/timewarp/timewarp/blob/v0.0.0/src/commands/hello/world.ts)_

## `timewarp help [COMMAND]`

Display help for timewarp.

```
USAGE
  $ timewarp help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for timewarp.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.32/src/commands/help.ts)_

## `timewarp plugins`

List installed plugins.

```
USAGE
  $ timewarp plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ timewarp plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/index.ts)_

## `timewarp plugins add PLUGIN`

Installs a plugin into timewarp.

```
USAGE
  $ timewarp plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into timewarp.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TIMEWARP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TIMEWARP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ timewarp plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ timewarp plugins add myplugin

  Install a plugin from a github url.

    $ timewarp plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ timewarp plugins add someuser/someplugin
```

## `timewarp plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ timewarp plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ timewarp plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/inspect.ts)_

## `timewarp plugins install PLUGIN`

Installs a plugin into timewarp.

```
USAGE
  $ timewarp plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into timewarp.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TIMEWARP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TIMEWARP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ timewarp plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ timewarp plugins install myplugin

  Install a plugin from a github url.

    $ timewarp plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ timewarp plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/install.ts)_

## `timewarp plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ timewarp plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ timewarp plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/link.ts)_

## `timewarp plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ timewarp plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ timewarp plugins unlink
  $ timewarp plugins remove

EXAMPLES
  $ timewarp plugins remove myplugin
```

## `timewarp plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ timewarp plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/reset.ts)_

## `timewarp plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ timewarp plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ timewarp plugins unlink
  $ timewarp plugins remove

EXAMPLES
  $ timewarp plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/uninstall.ts)_

## `timewarp plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ timewarp plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ timewarp plugins unlink
  $ timewarp plugins remove

EXAMPLES
  $ timewarp plugins unlink myplugin
```

## `timewarp plugins update`

Update installed plugins.

```
USAGE
  $ timewarp plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/update.ts)_
<!-- commandsstop -->
