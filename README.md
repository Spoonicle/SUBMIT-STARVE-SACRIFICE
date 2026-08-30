# SUBMIT STARVE SACRIFICE - Kinetic Poem
---

## Live Server
   [https://spoonicle.github.io/SUBMIT-STARVE-SACRIFICE/](url)
 
## Artist Statement
   [https://docs.google.com/document/d/1X0uYNIlDAr2Yxoh2xHR-86Sn_yNqjmaNplCkN4sFXew/edit?usp=sharing](url)

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)

### Running the Server
To launch the server locally:

```bash
npm start
```

or for development mode:

```bash
npm run dev
```

Navigate to **`http://localhost:3000`** in your browser.

---

## 🌐 Deploying to GitHub Pages

This project includes an **automatic client-side stream fallback**, making it 100% compatible with static site hosting services like **GitHub Pages** without requiring a live Node.js server!

1. Push your repository to GitHub.
2. Go to repository **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` (or `master`) and `/ (root)` folder.
   - Click **Save**.
4. Your site will automatically go live at `https://<your-username>.github.io/<repo-name>/`.

---

## ⌨️ Interaction Controls & Secret Phrases

### 1. Initial Launch & Global Restart
- **Spacebar**: When the website first loads, the ASCII stream remains passive. Pressing the **Spacebar** activates the initial phrase loop animation (`" SATIATE THEIR HUNGER  "`).
- **Enter**: Pressing **Enter** at any time completely **restarts** the application back to its initial pre-started state (clears active outline text, resets theme color to default white, and clears timers/custom phrases).

---

### 2. Built-in Looping Phrases

| Phase / Condition | Looping Phrase | Loop Speed | Description |
| :--- | :--- | :--- | :--- |
| **Default Start** | `" SATIATE THEIR HUNGER  "` | `1600ms` (1.6s) | Default automated character-by-character phrase sequence. |
| **Accelerated Trigger** | `" THEY EAT FIRST "` | `400ms` (0.4s) | Triggered when any variant of *HUNGRY TOO* is typed by the user. |
| **Post-Inversion Mode** | `" <USER_CUSTOM_MESSAGE> "` | `800ms` (0.8s) | Looped character-by-character after user pauses typing in post-inversion mode. |

---

### 3. Secret Phrases Registry (User Input Triggers)

The user can type secret phrases at any time during playback. Matching keystrokes outline characters on screen:

| Secret Phrase | Triggered Action |
| :--- | :--- |
| `TAKE MY FLESH` | **Unlocks Free-Type Mode**: Outlines whatever letter the user types. |
| `IM HUNGRY TOO` | Switches the automated looping phrase to `" THEY EAT FIRST "` at an accelerated rate (400ms interval). |
| `I'M HUNGRY TOO` | Same as above (includes apostrophe). |
| `WERE HUNGRY TOO` | Same as above. |
| `WE'RE HUNGRY TOO` | Same as above (includes apostrophe). |
| `FEAST` | **Inverts Theme Colors & Activates Custom Phrase Mode**: Inverts dark/white theme colors. The final letter **'T'** remains visible for 0.5s before vanishing. |

---

### 4. Post-Inversion Custom Message Mode (`FEAST` Triggered)

After completing the secret phrase `FEAST`:

1. **Real-time Display**: Letters appear immediately on screen as the user types.
2. **Auto-Looping**: Pausing typing for 600ms automatically begins looping the typed message character-by-character at an 800ms interval.
3. **Overwrite On New Typing**: If a phrase is actively looping and the user starts typing a new message, the old phrase is **overwritten** immediately by the new message.
4. **Editing Keys**:
   - `Backspace`: Deletes the last character typed from the phrase buffer.
   - `Escape` / `Delete`: Clears the custom message entirely.

---

## 🎨 Visualizer Features & Modes

- **6 Rendering Modes**: Matrix Rain, 3D ASCII Donut, Cyber Glitch Dump, Fluid Wave Field, Starfield Tunnel, and Server SSE Stream Grid.
- **Color Themes**: White Monochrome, Inverted, Matrix Green, Amber CRT, Synthwave Pink, Blood Red, Hologram Cyan, and Rainbow.
- **CRT Visual FX**: Phosphor bloom, screen scanlines, screen curvature, and audio tick clicker feedback.
