import { useCallback, useEffect, useRef } from "react";
import { ThemeProvider } from "@renderer/theme/ThemeProvider";

const sprayPalette = [
  "#ff1744",
  "#ff6f00",
  "#ffea00",
  "#76ff03",
  "#00e676",
  "#00e5ff",
  "#2979ff",
  "#651fff",
  "#d500f9",
  "#ff4081",
  "#f50057",
  "#fafafa",
];

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const useSprayParticles = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastSpray = 0;
    const handleMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastSpray < 50) return;
      lastSpray = now;
      if (Math.random() > 0.7) {
        createSprayParticle(event.clientX, event.clientY, container);
      }
    };

    const interval = window.setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.5;
      createSprayParticle(x, y, container);
    }, 2000);

    document.addEventListener("mousemove", handleMove);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      window.clearInterval(interval);
    };
  }, [containerRef]);
};

const useGraffitiBackground = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const baseShapes: Array<["circle" | "square" | "triangle" | "star", number, number, number]> = [
      ["circle", 200, 150, 80],
      ["square", window.innerWidth - 250, 200, 100],
      ["triangle", window.innerWidth / 2, 400, 120],
    ];

    baseShapes.forEach(([shape, x, y, size]) =>
      createGraffitiShape(container, shape, x, y, size),
    );

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const { scrollY } = window;
      if (Math.abs(scrollY - lastScrollY) > 300) {
        lastScrollY = scrollY;
        const x = Math.random() * window.innerWidth;
        const y = scrollY + Math.random() * window.innerHeight;
        const size = Math.random() * 80 + 40;
        const shapes: Array<"circle" | "square" | "triangle" | "star"> = [
          "circle",
          "square",
          "triangle",
          "star",
        ];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        createGraffitiShape(container, randomShape, x, y, size);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      container.innerHTML = "";
    };
  }, [containerRef]);
};

const useScrollAnimations = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    const targets = document.querySelectorAll(".feature-card");
    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);
};

const useSakuraPetals = () => {
  useEffect(() => {
    const petals = new Set<HTMLDivElement>();
    const timeouts: number[] = [];

    const interval = window.setInterval(() => {
      if (Math.random() <= 0.7) return;
      const petal = document.createElement("div");
      petal.className = "sakura-petal";
      petal.style.left = `${Math.random() * window.innerWidth}px`;
      petal.style.top = "-20px";
      petal.style.animationDuration = `${Math.random() * 10 + 10}s`;
      petal.style.animationDelay = `${Math.random() * 2}s`;
      document.body.appendChild(petal);
      petals.add(petal);

      const timeout = window.setTimeout(() => {
        petal.remove();
        petals.delete(petal);
      }, 20000);
      timeouts.push(timeout);
    }, 800);

    return () => {
      window.clearInterval(interval);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      petals.forEach((petal) => petal.remove());
    };
  }, []);
};

const useJapaneseGlitch = () => {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".hero-title, .section-title, .cta-title"),
    );
    const timers = targets.map((element) =>
      window.setInterval(() => {
        if (Math.random() > 0.85) {
          const previousAnimation = element.style.animation;
          element.style.animation = "none";
          window.setTimeout(() => {
            element.style.animation = previousAnimation;
          }, 50);
        }
      }, 3000),
    );
    return () => timers.forEach((timer) => window.clearInterval(timer));
  }, []);
};

const useCrazyAnimations = () => {
  useEffect(() => {
    const titleNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".feature-card h3"),
    );
    const buttonNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".btn-hero, .btn-download"),
    );

    const hoverHandlers = new Map<HTMLElement, () => void>();
    buttonNodes.forEach((button) => {
      const handler = () => {
        button.style.animation = "shake 0.5s ease-in-out";
        window.setTimeout(() => {
          button.style.animation = "";
        }, 500);
      };
      button.addEventListener("mouseenter", handler);
      hoverHandlers.set(button, handler);
    });

    const interval = window.setInterval(() => {
      titleNodes.forEach((node) => {
        if (Math.random() > 0.9) {
          const previous = node.style.color;
          const nextColor = sprayPalette[Math.floor(Math.random() * sprayPalette.length)];
          node.style.color = nextColor;
          window.setTimeout(() => {
            node.style.color = previous;
          }, 500);
        }
      });
    }, 2000);

    return () => {
      window.clearInterval(interval);
      hoverHandlers.forEach((handler, button) => {
        button.removeEventListener("mouseenter", handler);
      });
      hoverHandlers.clear();
    };
  }, []);
};

const useParallaxSpray = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      document
        .querySelectorAll<HTMLElement>(".hero-graffiti, .cta-spray")
        .forEach((element) => {
          element.style.transform = `translateY(${scrolled * 0.2}px)`;
        });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
};

export const App = () => {
  const graffitiBgRef = useRef<HTMLDivElement>(null);
  const sprayContainerRef = useRef<HTMLDivElement>(null);

  useSprayParticles(sprayContainerRef);
  useGraffitiBackground(graffitiBgRef);
  useScrollAnimations();
  useSakuraPetals();
  useJapaneseGlitch();
  useCrazyAnimations();
  useParallaxSpray();

  const handleDemoClick = useCallback(() => scrollToSection("demo"), []);
  const handleFeaturesClick = useCallback(() => scrollToSection("features"), []);
  const handleDownloadClick = useCallback(() => scrollToSection("download"), []);
  const handleTopClick = useCallback(() => scrollToSection("top"), []);

  return (
    <ThemeProvider>
      <div id="top">
        <div className="graffiti-bg" id="graffitiBg" ref={graffitiBgRef} />
        <nav className="nav">
        <div className="nav-container">
          <div className="logo">
            <a
              className="logo-link"
              id="logo-link"
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                handleTopClick();
              }}
            >
              <span className="logo-text">GRIDPARK</span>
            </a>
          </div>
          <ul className="nav-menu">
            <li>
              <a
                href="#demo"
                onClick={(event) => {
                  event.preventDefault();
                  handleDemoClick();
                }}
              >
                Demo
              </a>
            </li>
            <li>
              <a
                href="#features"
                onClick={(event) => {
                  event.preventDefault();
                  handleFeaturesClick();
                }}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#philosophy"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("philosophy");
                }}
              >
                Philosophy
              </a>
            </li>
            <li>
              <a
                className="btn-primary"
                href="#download"
                onClick={(event) => {
                  event.preventDefault();
                  handleDownloadClick();
                }}
              >
                Download
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <main>
        <section className="hero" id="hero">
          <div className="spray-container" id="sprayContainer" ref={sprayContainerRef} />
          <div className="hero-content">
            <div className="hero-icon-wrapper">
              <img src="./images/app-icon.png" alt="Gridpark Icon" className="hero-app-icon" />
            </div>
            <p className="hero-subtitle">Excel × Web Technologies = 🔥</p>
            <p className="hero-description">
              Turn spreadsheets into a playground for ideas.
              <br />
              An <span className="oss-badge">OSS</span> experimental canvas for creation.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero btn-neon" type="button" onClick={handleDemoClick}>
                Try Demo
              </button>
              <button
                className="btn-hero btn-outline"
                type="button"
                onClick={handleFeaturesClick}
              >
                See Features
              </button>
            </div>
          </div>
          <svg className="hero-graffiti" viewBox="0 0 800 600">
            <defs>
              <filter id="spray1">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="12"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text
              x="50"
              y="100"
              fontFamily="Permanent Marker"
              fontSize="50"
              fill="#ff1744"
              opacity="0.35"
              transform="rotate(-15 50 100)"
            >
              最高！
            </text>
            <text
              x="700"
              y="150"
              fontFamily="Permanent Marker"
              fontSize="45"
              fill="#76ff03"
              opacity="0.3"
              transform="rotate(12 700 150)"
            >
              ヤバイ
            </text>
            <text
              x="350"
              y="500"
              fontFamily="Rubik"
              fontSize="55"
              fill="#00e5ff"
              opacity="0.35"
              fontWeight="900"
              transform="rotate(-8 350 500)"
            >
              神
            </text>
            <text
              x="150"
              y="400"
              fontFamily="Permanent Marker"
              fontSize="38"
              fill="#d500f9"
              opacity="0.28"
              transform="rotate(20 150 400)"
            >
              グリッド
            </text>
            <text
              x="600"
              y="450"
              fontFamily="Rubik"
              fontSize="48"
              fill="#ffea00"
              opacity="0.32"
              fontWeight="900"
              transform="rotate(-18 600 450)"
            >
              芸術
            </text>
            <text
              x="250"
              y="250"
              fontFamily="Permanent Marker"
              fontSize="42"
              fill="#ff6f00"
              opacity="0.3"
              transform="rotate(8 250 250)"
            >
              カオス
            </text>
            <text
              x="500"
              y="180"
              fontFamily="Rubik"
              fontSize="40"
              fill="#2979ff"
              opacity="0.26"
              fontWeight="900"
              transform="rotate(-12 500 180)"
            >
              激アツ
            </text>
            <text
              x="120"
              y="520"
              fontFamily="Permanent Marker"
              fontSize="36"
              fill="#f50057"
              opacity="0.28"
              transform="rotate(15 120 520)"
            >
              COOL
            </text>
            <text
              x="680"
              y="380"
              fontFamily="Rubik"
              fontSize="44"
              fill="#651fff"
              opacity="0.3"
              fontWeight="900"
              transform="rotate(-20 680 380)"
            >
              革命
            </text>
            <text
              x="420"
              y="320"
              fontFamily="Permanent Marker"
              fontSize="38"
              fill="#00e676"
              opacity="0.27"
              transform="rotate(10 420 320)"
            >
              ストリート
            </text>
            <g className="drip-group">
              <path
                d="M100,50 Q100,80 95,100 L95,150 L93,170 L95,190 L93,210"
                stroke="#ff1744"
                strokeWidth="25"
                fill="none"
                filter="url(#spray1)"
                opacity="0.85"
              />
              <path
                d="M200,30 Q200,70 205,90 L205,140 L207,160 L205,180 L207,200"
                stroke="#76ff03"
                strokeWidth="22"
                fill="none"
                filter="url(#spray1)"
                opacity="0.8"
              />
              <path
                d="M700,80 Q700,120 695,150 L695,200 L693,220 L695,240 L693,260"
                stroke="#ffea00"
                strokeWidth="28"
                fill="none"
                filter="url(#spray1)"
                opacity="0.75"
              />
              <path
                d="M400,40 Q400,65 398,85 L398,120 L396,140"
                stroke="#00e5ff"
                strokeWidth="18"
                fill="none"
                filter="url(#spray1)"
                opacity="0.7"
              />
              <path
                d="M550,60 Q550,90 548,110 L548,150 L546,170 L548,190"
                stroke="#d500f9"
                strokeWidth="24"
                fill="none"
                filter="url(#spray1)"
                opacity="0.8"
              />
              <path
                d="M300,20 Q300,50 298,70 L298,110 L296,130"
                stroke="#ff6f00"
                strokeWidth="20"
                fill="none"
                filter="url(#spray1)"
                opacity="0.72"
              />
              <path
                d="M650,100 Q650,130 648,150 L648,190 L646,210"
                stroke="#2979ff"
                strokeWidth="19"
                fill="none"
                filter="url(#spray1)"
                opacity="0.68"
              />
              <path
                d="M150,70 Q150,100 148,120 L148,160"
                stroke="#f50057"
                strokeWidth="21"
                fill="none"
                filter="url(#spray1)"
                opacity="0.75"
              />
            </g>
            <path
              d="M50 580 L 150 520 L 250 580 Z"
              fill="#ff1744"
              opacity="0.2"
              filter="url(#spray1)"
            />
            <circle cx="250" cy="200" r="30" fill="#ff4081" opacity="0.45" filter="url(#spray1)" />
            <circle cx="500" cy="350" r="40" fill="#00e676" opacity="0.4" filter="url(#spray1)" />
            <circle cx="650" cy="250" r="25" fill="#ffea00" opacity="0.5" filter="url(#spray1)" />
            <circle cx="100" cy="300" r="35" fill="#2979ff" opacity="0.43" filter="url(#spray1)" />
            <circle cx="750" cy="400" r="32" fill="#d500f9" opacity="0.47" filter="url(#spray1)" />
            <circle cx="380" cy="180" r="28" fill="#76ff03" opacity="0.41" filter="url(#spray1)" />
            <circle cx="580" cy="520" r="26" fill="#ff6f00" opacity="0.44" filter="url(#spray1)" />
            <g className="grid-pattern" opacity="0.15">
              <line x1="0" y1="100" x2="800" y2="105" stroke="#ff4081" strokeWidth="2" strokeDasharray="8,12" />
              <line x1="0" y1="200" x2="800" y2="195" stroke="#00e676" strokeWidth="2" strokeDasharray="10,8" />
              <line x1="0" y1="300" x2="800" y2="305" stroke="#2979ff" strokeWidth="2" strokeDasharray="6,14" />
              <line x1="100" y1="0" x2="105" y2="600" stroke="#ffea00" strokeWidth="2" strokeDasharray="12,10" />
              <line x1="300" y1="0" x2="295" y2="600" stroke="#d500f9" strokeWidth="2" strokeDasharray="8,8" />
              <line x1="500" y1="0" x2="505" y2="600" stroke="#ff6f00" strokeWidth="2" strokeDasharray="10,12" />
              <line x1="700" y1="0" x2="695" y2="600" stroke="#00e5ff" strokeWidth="2" strokeDasharray="14,6" />
            </g>
          </svg>
        </section>
        <section className="demo" id="demo">
          <h2 className="section-title spray-text" data-jp="体験">
            Interactive Demo
          </h2>
          <div className="demo-container">
            <div className="demo-live-app">
              <img 
                src="./images/demo-screenshot.png" 
                alt="Gridpark Demo - Street Art Themed Inventory Management"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          </div>
        </section>
        <section className="features" id="features">
          <h2 className="section-title spray-text" data-jp="技術仕様">
            Technical Specs
          </h2>
          <div className="tech-intro">
            <p className="tech-tagline">
              "A workbook that behaves like a web app — scriptable, stylable, and alive."
            </p>
            <p className="tech-subtitle">Gridpark = CSS + JavaScript + OOXML-Compliant .xlsx 🔥</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <rect x="15" y="15" width="50" height="50" fill="none" stroke="#00e5ff" strokeWidth="4" rx="5" />
                  <path d="M25,25 L35,25 M25,35 L45,35 M25,45 L40,45 M25,55 L50,55" stroke="#d500f9" strokeWidth="3" strokeLinecap="round" />
                  <rect x="10" y="10" width="60" height="60" fill="none" stroke="#ff1744" strokeWidth="2" opacity="0.3" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>1. OOXML-Compliant File Structure</h3>
                <p>Gridpark workbooks are built on a fully OOXML-compliant architecture, meaning every .xlsx file remains 100% compatible with Excel. We embed Gridpark logic and styles inside the standard ZIP container—no proprietary format, no black boxes.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#ff6f00" strokeWidth="4" />
                  <path d="M20,40 Q40,15 60,40 Q40,65 20,40" fill="none" stroke="#76ff03" strokeWidth="4" />
                  <circle cx="40" cy="40" r="10" fill="#ff1744" opacity="0.6" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>2. Spreadsheet Operations as Selectors</h3>
                <p>Rows, columns, cells, sheets—everything becomes selectable. Gridpark turns the spreadsheet into a DOM-like surface where every part can be addressed with expressive, CSS-style selectors.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <rect x="20" y="15" width="40" height="50" fill="none" stroke="#00e5ff" strokeWidth="4" rx="4" />
                  <path d="M28,25 L52,25" stroke="#ff1744" strokeWidth="4" strokeLinecap="round" />
                  <path d="M28,40 L48,40" stroke="#76ff03" strokeWidth="4" strokeLinecap="round" />
                  <path d="M28,55 L44,55" stroke="#ffea00" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>3. Style with Standard CSS</h3>
                <p>Instead of Excel's limited formatting rules, Gridpark lets you style spreadsheets using pure CSS, from typography and colors to animations, gradients, and custom effects. If the browser can render it, Gridpark can style it.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#06d6a0" strokeWidth="4" />
                  <circle cx="40" cy="40" r="20" fill="none" stroke="#f72585" strokeWidth="4" />
                  <circle cx="40" cy="40" r="10" fill="#fcbf49" opacity="0.8" />
                  <path d="M40,10 L40,25 M40,55 L40,70 M10,40 L25,40 M55,40 L70,40" stroke="#e63946" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>4. Program with Standard JavaScript</h3>
                <p>Logic is written in vanilla JavaScript, applied directly to spreadsheet elements via selectors. Build interactive behaviors, reactive rules, or entire mini-apps inside your workbook—no custom language needed.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <path d="M40,15 L50,25 L60,20 L55,35 L65,45 L50,50 L55,65 L40,55 L25,65 L30,50 L15,45 L25,35 L20,20 L30,25 Z" fill="none" stroke="#ffea00" strokeWidth="4" />
                  <circle cx="40" cy="40" r="10" fill="#ff6f00" opacity="0.6" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>5. Switchable Themes</h3>
                <p>Gridpark supports theme switching out of the box. Users can instantly switch between visual styles—minimal, playful, dark mode, or fully customized themes—to match their workflow or mood.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <rect x="15" y="15" width="50" height="50" fill="none" stroke="#2979ff" strokeWidth="4" rx="5" />
                  <text x="40" y="50" fontFamily="monospace" fontSize="24" fill="#00e676" textAnchor="middle" fontWeight="bold">OSS</text>
                  <path d="M25,60 L35,70 M55,60 L45,70" stroke="#ff4081" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="feature-card-content">
                <h3>6. Entirely Open Source</h3>
                <p>Gridpark is 100% open source. Every feature, every extension point, every theme—open to inspect, fork, remix, and improve. The spreadsheet becomes not just a tool but a creative playground for the community.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="philosophy" id="philosophy">
          <div className="philosophy-container">
            <div className="philosophy-block mission-block">
              <div className="block-header">
                <h2 className="block-title">
                  <span className="jp-title">ミッション</span>
                  <span className="en-title">MISSION</span>
                </h2>
              </div>
              <div className="block-content">
                <p className="main-quote">"Transform spreadsheets into playgrounds"</p>
                <p className="description">
                  Turn data manipulation from routine work into creative experimentation, making
                  spreadsheets a medium for play and discovery within safe boundaries.
                  <br />
                  <span className="highlight">Excel = Canvas. Data = Paint. You = Artist.</span>
                </p>
              </div>
              <svg className="block-graffiti" viewBox="0 0 200 200">
                <path d="M50,100 Q100,50 150,100" stroke="#ff1744" strokeWidth="8" fill="none" opacity="0.4" />
                <circle cx="50" cy="100" r="15" fill="#ff6f00" opacity="0.5" />
                <circle cx="150" cy="100" r="15" fill="#ffea00" opacity="0.5" />
              </svg>
            </div>
            <div className="philosophy-block vision-block">
              <div className="block-header">
                <h2 className="block-title">
                  <span className="jp-title">ビジョン</span>
                  <span className="en-title">VISION</span>
                </h2>
              </div>
              <div className="block-content">
                <p className="main-quote">"Redesign the relationship between people and numbers"</p>
                <p className="description">
                  A world where working with data sparks creativity and joy,
                  not just efficiency. Where spreadsheets become canvases for expression,
                  experimentation becomes natural, and every data interaction feels like
                  landing a perfect trick.
                </p>
              </div>
              <svg className="block-graffiti" viewBox="0 0 200 200">
                <path d="M30,150 L170,150" stroke="#00e676" strokeWidth="10" opacity="0.4" />
                <path d="M30,50 L170,50" stroke="#2979ff" strokeWidth="10" opacity="0.3" />
                <circle cx="100" cy="100" r="35" fill="#ff4081" opacity="0.45" />
              </svg>
            </div>
            <div className="philosophy-block values-block">
              <div className="block-header">
                <h2 className="block-title">
                  <span className="jp-title">バリュー</span>
                  <span className="en-title">VALUES</span>
                </h2>
              </div>
              <div className="block-content">
                <div className="values-grid">
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">🧪</span>
                      <span className="value-name">Safety by Design</span>
                    </h3>
                    <p>Powerful tools should be safe by default. Every feature is built within protective boundaries, ensuring you can experiment freely without system risk.</p>
                  </div>
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">🛹</span>
                      <span className="value-name">Playful Productivity</span>
                    </h3>
                    <p>Data exploration should be engaging, experimental, and fun while remaining genuinely useful.</p>
                  </div>
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">🔮</span>
                      <span className="value-name">Creative Expression</span>
                    </h3>
                    <p>Everyone has a unique way of thinking about data. Our tools amplify personal creativity within predictable boundaries.</p>
                  </div>
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">🎛️</span>
                      <span className="value-name">Hackable Within Limits</span>
                    </h3>
                    <p>The best tools bend to your will while keeping you safe. Everything is customizable and extensible within our protected environment.</p>
                  </div>
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">📊</span>
                      <span className="value-name">Reasonably compatible with Excel</span>
                    </h3>
                    <p>Innovation builds on what people already know. We provide reasonable compatibility with Excel.</p>
                  </div>
                  <div className="value-item">
                    <h3>
                      <span className="value-icon">💻</span>
                      <span className="value-name">Local-First Control</span>
                    </h3>
                    <p>Your data belongs on your machine. We build desktop-first experiences that work offline and keep you in complete control.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="cta" id="download">
          <div className="cta-content">
            <h2 className="cta-title">Ready to land a trick?</h2>
            <p className="cta-description">
              DΛ雲WN爐LOAD🛣️ﾀﾞｳN露-ﾛｰ度$DΛWN炉ADﾄﾞ
            </p>
            <div className="cta-buttons">
              <a className="btn-download btn-glow" href="https://github.com/watilde/Gridpark/releases" target="_blank">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download for Mac
              </a>
              <a className="btn-download btn-glow" href="https://github.com/watilde/Gridpark/releases" target="_blank">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="9" />
                  <rect x="14" y="7" width="3" height="5" />
                </svg>
                Download for Windows
              </a>
            </div>
          </div>
          <svg className="cta-spray" viewBox="0 0 400 400">
            <circle
              cx="200"
              cy="200"
              r="150"
              fill="none"
              stroke="#f72585"
              strokeWidth="35"
              opacity="0.25"
              filter="url(#spray1)"
              className="spray-circle"
            />
            <circle
              cx="200"
              cy="200"
              r="100"
              fill="none"
              stroke="#06d6a0"
              strokeWidth="30"
              opacity="0.3"
              filter="url(#spray1)"
              className="spray-circle"
            />
            <circle
              cx="200"
              cy="200"
              r="50"
              fill="none"
              stroke="#fcbf49"
              strokeWidth="25"
              opacity="0.35"
              filter="url(#spray1)"
              className="spray-circle"
            />
          </svg>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span>™GRIDPARK - 2025</span>
          </div>
          <div className="footer-links">
            <a href="https://github.com/watilde/Gridpark" target="_blank">
              GitHub
            </a>
            <a href="https://x.com/watilde" target="_blank">
              Author
            </a>
            <a href="https://ja.wikipedia.org/wiki/%E6%9F%B4%E7%8A%AC" target="_blank">
              柴犬
            </a>
          </div>
        </div>
      </footer>
      </div>
    </ThemeProvider>
  );
};

const createSprayParticle = (x: number, y: number, container: HTMLElement) => {
  const particle = document.createElement("div");
  const size = Math.random() * 8 + 4;
  const color = sprayPalette[Math.floor(Math.random() * sprayPalette.length)];
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 100 + 50;
  const duration = Math.random() * 2 + 1;

  particle.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    border-radius: 50%;
    pointer-events: none;
    filter: blur(${Math.random() * 2}px);
    box-shadow: 0 0 ${size * 2}px ${color};
    opacity: 0.8;
    transition: all ${duration}s ease-out;
  `;

  container.appendChild(particle);
  requestAnimationFrame(() => {
    particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    particle.style.opacity = "0";
  });

  window.setTimeout(() => {
    particle.remove();
  }, duration * 1000);
};

const createGraffitiShape = (
  container: HTMLDivElement,
  shape: "circle" | "square" | "triangle" | "star",
  x: number,
  y: number,
  size: number,
) => {
  const color = sprayPalette[Math.floor(Math.random() * sprayPalette.length)];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size * 2));
  svg.setAttribute("height", String(size * 2));
  svg.style.position = "absolute";
  svg.style.left = `${x}px`;
  svg.style.top = `${y}px`;
  svg.style.pointerEvents = "none";
  svg.style.opacity = "0";
  svg.style.filter = "blur(2px)";
  svg.style.animation = "graffitiAppear 2s ease-out forwards";

  let element: SVGElement | null = null;
  if (shape === "circle") {
    element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    element.setAttribute("cx", String(size));
    element.setAttribute("cy", String(size));
    element.setAttribute("r", String(size * 0.8));
  } else if (shape === "square") {
    element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    element.setAttribute("x", String(size * 0.2));
    element.setAttribute("y", String(size * 0.2));
    element.setAttribute("width", String(size * 1.6));
    element.setAttribute("height", String(size * 1.6));
    element.setAttribute(
      "transform",
      `rotate(${Math.random() * 30 - 15} ${size} ${size})`,
    );
  } else if (shape === "triangle") {
    element = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    element.setAttribute(
      "points",
      `${size},${size * 0.2} ${size * 0.2},${size * 1.8} ${size * 1.8},${size * 1.8}`,
    );
  } else {
    element = document.createElementNS("http://www.w3.org/2000/svg", "path");
    element.setAttribute("d", createStarPath(size, size, size * 0.8, 5));
  }

  element?.setAttribute("fill", "none");
  element?.setAttribute("stroke", color);
  element?.setAttribute("stroke-width", "3");
  element?.setAttribute("opacity", "0.15");

  if (element) {
    svg.appendChild(element);
    container.appendChild(svg);
    window.setTimeout(() => {
      svg.style.animation = "graffitiDisappear 2s ease-out forwards";
      window.setTimeout(() => svg.remove(), 2000);
    }, 5000);
  }
};

const createStarPath = (cx: number, cy: number, radius: number, points: number) => {
  let path = "";
  const angle = (Math.PI * 2) / points;
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.5;
    const a = angle * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    path += `${i === 0 ? "M" : "L"} ${x},${y} `;
  }
  path += "Z";
  return path;
};
