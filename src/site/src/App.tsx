import { ThemeProvider } from "@renderer/theme/ThemeProvider";
import { HeroDemo } from "./HeroDemo";

export const App = () => (
  <ThemeProvider>
    <div className="docs-shell">
      <div className="spray-overlay" />
      <div className="site-header">
        <div className="site-header__inner">
          <div className="site-header__brand">Gridpark</div>
          <div className="site-header__actions">
            <a className="cta primary small" href="#top">
              Download
            </a>
          </div>
        </div>
      </div>
      <section className="hero" id="top">
        <div className="hero__content">
          <p className="hero__eyebrow">Transform spreadsheets into playgrounds</p>
          <div className="hero__logo">
            <img src="./icon.png" alt="Gridpark icon" />
          </div>
          <p className="hero__lede">
            Turn data manipulation from routine work into creative experimentation,
            making spreadsheets a medium for play and discovery within safe boundaries.
          </p>
          <HeroDemo />
        </div>
      </section>
      <footer className="site-footer">
        <p>Made by <a href="https://x.com/watilde">@watilde</a></p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  </ThemeProvider>
);
