# Kaizen Accelerator Website (Static)

This is a lightweight multi-page static website you can deploy via **GitHub Pages**.

## Pages
- `index.html` — Home
- `kaizen-accelerator.html` — Standard offer ($20K)
- `premium.html` — Premium offer ($35K+)
- `how-it-works.html`
- `target-processes.html`
- `roi.html`
- `about.html`
- `faq.html`
- `intake.html` — Intake form
- `thanks.html` — Thank-you page

## Configure the intake form
Open `intake.html` and update:

- `action="https://formspree.io/f/yourFormID"` → your Formspree endpoint  
- `data-email="your@email.com"` → your email for mailto fallback

If you leave the Formspree placeholder, the form will open a `mailto:` draft as a fallback and then send users to `thanks.html`.

## Deploy to GitHub Pages
1. Create a GitHub repo and upload these files (root directory).
2. In GitHub: **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`
5. Your site will be live at the Pages URL.

## Edit branding
Update name/title/email inside the HTML or search-replace:
- `Philip Kling`
- `Lean Six Sigma Master Black Belt | Product + Process Leader`
