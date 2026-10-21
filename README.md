# Raiyan's Portfolio

My personal portfolio website. It shows my projects, resume and a small learning log. I built it with plain HTML, CSS and JavaScript, so there's no framework, build step or backend.

**Live site:** https://tahlilalraiyan.me

## What's inside

- **Home:** a short intro, about section, skills, education timeline and contact links
- **Projects:** my GitHub projects in C#, Java and Python, each linking to its repo
- **Learning log:** short notes on what I build and learn
- **Resume and CV:** you can preview the PDF first, then choose to download it
- **404 page:** a custom page for broken links

## Details I enjoyed building

- A small plane that flies along the top of the page as you scroll, showing how much you have explored, with a loop at 25%, 50%, 75% and 100%
- A section label that follows where you are on the page
- Nav links with a letter-wave on hover, a spark burst on click and a glowing dot on the current section
- A music button with seven calm tracks, generated live in the browser with the Web Audio API (no audio files). It plays them one after another in Auto mode, or you can pick one yourself, and it remembers your on/off choice
- A live Dhaka clock in the header
- Cards with a spotlight and a small tilt effect on hover
- A custom cursor on desktop
- A mobile menu, and reduced motion support for people who turn animations off

## Built with

- HTML
- CSS
- JavaScript (no libraries)
- Web Audio API for the music
- Google Fonts: Bricolage Grotesque and Instrument Sans
- Hosted on GitHub Pages with a custom domain

## Project structure

```
portfolio/
├── index.html
├── blog.html
├── 404.html
├── style.css
├── script.js
├── mini.js
├── extras.css
├── extras.js
├── CNAME
├── logo.png
├── profile.jpg
├── Raiyan_Resume.pdf
└── Raiyan_CV.pdf
```

`extras.css` and `extras.js` hold the scroll plane, nav effects and music player. `CNAME` is created by GitHub Pages for the custom domain, so it should stay in the repo.

## Music notes

Browsers only allow sound after a first click, tap or key press, so the music starts on the visitor's first interaction.

Small tweaks live at the top of the `Music` block in `extras.js`: `VOL` for volume, `AUTO_SECONDS` for how long each track plays in Auto mode, and the `AUTO` list for which tracks Auto uses.

## Run it locally

Clone the repo and open `index.html` in your browser.

For a better setup, start a small local server from the project folder:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Contact

- Email: mohammad.tahlil.al.raiyan@gmail.com
- GitHub: [@TahlilAlRaiyan](https://github.com/TahlilAlRaiyan)

&copy; 2026 Mohammad Tahlil Al-Raiyan
