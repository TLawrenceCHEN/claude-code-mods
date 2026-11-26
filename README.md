# claude-code-mods

Cozy animated backdrops for the Claude Code desktop and mobile apps, each one
reacting to how full the session's context window is.

| Mod | What it looks like |
| --- | --- |
| `pixel-snow` | A pixel-art winter night: a cabin, pines and falling snow. The snow on the ground deepens as the context window fills, and the fill is painted on a wooden sign stuck in the snow. Dark ink-blue colors with an icy accent, monospace type and square message boxes. |
| `firefly-meadow` | A dusky meadow under a crescent moon. More fireflies come out as the context window fills, from 6 to 64. Dark indigo colors with a firefly-gold accent. |

Only one theme shows at a time, so install one of them.

## Install

At the prompt of a terminal session:

```
/plugin install pixel-snow --marketplace TLawrenceCHEN/claude-code-mods
```

Answer `y` to add the marketplace, then pick the user scope so it loads in every session.

From a shell:

```
claude plugin install pixel-snow --marketplace TLawrenceCHEN/claude-code-mods
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `TLawrenceCHEN/claude-code-mods`, then Add plugin.

Use `firefly-meadow` in place of `pixel-snow` for the meadow.

The backdrops draw in the desktop and mobile apps; the terminal and editors draw no theme.
