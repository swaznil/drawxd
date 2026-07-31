# DrawxD

## Project Overview

DrawxD is a whiteboard canvas inspired by Excalidraw and tldraw. It is an experimental project where I've tried to recreate a modern infinite canvas.

---

### Motivation

When trying to teach somebody a concept online, I normally sketch ideas to help them understand visually, For that I needed an whitebaord app or a website. There werent much good free options and even the good ones had poor performance. Sometimes I just wanted to draw with stylus without internet, but I couldn't find any with infinite canvas, good performance and offline support. 

I created originally created this for my own personal use but later decided to host it online and use it as a hackclub, horizons project. I also used this as an opportunity to learn React, as I had less exposure to it.

---

### Live Demo

Project can be run locally by cloning the repository and using vite or directly through the link:

```
https://drawxd.vercel.app/
```

---

### Screenshots

![Example canvas on DrawxD](assets/screenshot01.png)

---

## Features

- Infinite Canvas
- Free hand pencil and custom shapes
- Drawings selection and movement
- Keyboard shortcuts
- Dark and light themes
- Custom canvas background
- Drawing color, opacity, and stroke width controls
- Automatic local saves
- Editable project import and export with .drawxd files
- PNG, JPEG, and WebP image export
- Custom rendering engine

## How It Works

DrawxD uses React and the HTML Canvas API with a custom object based rendering engine.

The engine keeps React canvas state and rendering in `Canvas.jsx`, pointer and keyboard behavior in `canvasEvents.js`, shared settings in `constants.js`, and save/export helpers in `project.js`.

## Tech Stack

- React
- HTML
- JavaScript
- CSS

---

## Project Structure

```text
drawxd/
├── assets/
├── src/
│   ├── components/
│   ├── engine/
│   │   └── shapes/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── .gitignore
├── .oxlintrc.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## AI Usage

ChatGPT, Claude and Codex: They were used occasionally to help me with creating initial structure, debugging issues, improving performance and polishing code structure.
All features, design decisions, and final integration were implemented by me.

---
