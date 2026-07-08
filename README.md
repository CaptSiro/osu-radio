<h3 align="right">
Development status: Pre-Alpha ⚠️
</h3>

<p align="center">
  <img src="https://raw.githubusercontent.com/Team-BTMC/osu-radio/refs/heads/master/build/icon.png" alt="osu!radio logo" width="128" height="128"/>
  <h1 align="center">osu!radio</h1>
</p>

<div align="center">
  <a href="https://discord.gg/xskgMKUHjV" target="_blank">
    <img src="https://img.shields.io/discord/1284644086820896879?color=7289da&label=BTMC Talent Server&logo=discord&logoColor=white" alt="Discord"/>
  </a>
  <br />
  <a href="https://github.com/orgs/Team-BTMC/projects/2">
    Roadmap
  </a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://figma.com/design/tNBJr7TlEsoWsWdAewqoUg/osu!-radio?node-id=0-1&t=aIuThZAj00HcSjM5-1">
    Figma
  </a>
</div>

## What is osu!radio?

osu!radio is a music player for the songs in your osu! library!

![osu!radio screenshot](https://github.com/user-attachments/assets/da67b906-1429-4cc1-9087-76026e94b98a "A desktop music player UI. The left sidebar has tabs for Songs and Settings, a search bar with filters, and a list of four song cards with title, artist, and length. The right side has player controls, with a square song cover image, song title, and artist. Below, icons for volume, shuffle, previous, play/pause, next, repeat, and add to playlist. In the top-right there is a queue icon.")

### Development Setup

> [!NOTE]
> To use `git` and `bun`, you need to have [Git](https://git-scm.com/), [Node.js](https://nodejs.org/en) and [Bun](https://bun.sh/) installed.

`1` | Open a terminal in the directory in which you want to download osu!radio. Then run the 2 following commands,

```sh
git clone https://github.com/Team-BTMC/osu-radio.git
```

```sh
cd osu-radio
```

`2` | Next, install the necessary dependencies to run osu!radio,

```sh
bun install
```

`A` | For a production (User) startup,

```
bun run start
```

`B` | For a hot reloading (Development) startup,

```
bun run dev
```

> [!WARNING]
> If you want to reset your osu!radio installation
>
> Windows: go to `%appdata%` (`Win + R`, type in `%appdata%`) and remove the `osu-radio` directory.
>
> Linux: go to `$XDG_DATA_HOME` (generally `~/.config/`) and remove the `osu-radio` directory.

### Contributing

> [!TIP]
> To get started, it's recommended to make a [fork](https://github.com/Team-BTMC/osu-radio/fork) of the repository.

If you're new to contributing, consider checking out [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/). This is a great guide to better understand what it means to contribute.

If you're interested in contributing towards development, we'd recommend reading [Good Manners of a PR & Best Practices](https://medium.com/deliveryherotechhub/good-manners-of-a-pull-request-some-best-practices-cb2de3c3aea1), as well as [How to write a perfect PR](https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/).

If you're interested in contributing as a designer, check out the [Figma](https://www.figma.com/design/tNBJr7TlEsoWsWdAewqoUg/osu!-radio?node-id=0-1&t=aIuThZAj00HcSjM5-1)

Remember! Contributions come in all shapes and sizes.

## The Vision

Technologies:

- Electron
- SolidJS
- TypeScript

Discussion mainly happens in the [BTMC TALENT SERVER](https://discord.gg/xskgMKUHjV), in the `#prj-osu-radio` channel.
<br />
We're not interested in changing tech stacks for this project for the time being. We're sticking with Electron and web tech for now.
<br />
For major **code** related matters (Discussions, PRs, Suggestions), contact **@CaptSiro**
<br />
For **design** related matters (UI/UX, Ideas, Suggestions), contact **@Dudu**
