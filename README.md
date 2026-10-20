# Raiyan's Portfolio

A plain HTML, CSS, and JavaScript portfolio. No build step, backend, or paid service.

```
portfolio/
├── index.html
├── style.css
├── script.js
├── mini.js
├── blog.html
├── 404.html
├── logo.png
├── profile.jpg
├── Raiyan_Resume.pdf
└── Raiyan_CV.pdf
```

Keep all four files in the SAME folder. If the page looks like plain unstyled text, `style.css` is missing next to `index.html`.

## What to update later

- Learning log: open `blog.html`, copy one `<article class="card2 post">` block and paste it at the top. `404.html` is shown automatically by GitHub Pages for broken links (if your repo is not named `portfolio`, change `REPO` at the top of `404.html`).

- Resume: replace `Raiyan_Resume.pdf` with a new PDF, same file name.
- New project: copy a `<article class="card project">` block in `index.html`.
- LinkedIn: add a line in the Contact section (an example comment is there).
- Live demo: uncomment the example button comment in the Projects section.

## Run locally

Option 1: double-click `index.html`.

Option 2 (recommended): in the `portfolio` folder run `python -m http.server 8000`, then open http://localhost:8000.

## Publish on GitHub Pages

1. Create a new public GitHub repository (for example `portfolio`).
2. Upload everything inside the `portfolio` folder so `index.html` is at the repository root.
3. Open **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
5. After a minute or two your site is live at `https://YOUR-USERNAME.github.io/portfolio/`.

Using Git:

```
git init
git add .
git commit -m "Add portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

## Use your Namecheap domain (GitHub Student Pack)

1. Claim the free `.me` domain from the Student Pack page on GitHub Education (Namecheap offer), and publish the site first (steps above).
2. In your GitHub repo, open **Settings > Pages > Custom domain**, type your domain (for example `raiyan.me`), and **Save**. GitHub adds a `CNAME` file to the repo.
3. In Namecheap, open **Domain List > Manage > Advanced DNS** and add these records (delete any default parking records first):

| Type | Host | Value |
|---|---|---|
| A Record | @ | 185.199.108.153 |
| A Record | @ | 185.199.109.153 |
| A Record | @ | 185.199.110.153 |
| A Record | @ | 185.199.111.153 |
| CNAME Record | www | tahlilalraiyan.github.io. |

4. Wait from a few minutes up to a few hours for DNS. Then tick **Enforce HTTPS** in GitHub Pages settings.
5. Do not create the `CNAME` file yourself with a guessed domain; a wrong one breaks the site.
