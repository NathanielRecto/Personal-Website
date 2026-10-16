// Nathaniel Recto · portfolio interactions
(() => {
  const EMAIL = "nrecto.0225@gmail.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ---------- Header + scrollspy ---------- */
  const header = $("#site-header");
  const navLinks = $$(".nav-pill a");
  const navSections = navLinks.map((a) => $(a.getAttribute("href")));
  const contactSection = $("#contact");

  function updateHeader() {
    header.classList.toggle("scrolled", window.scrollY > 80);

    // Highlight the last section whose top has passed 35% of the screen
    // (none once Contact is reached, since it has no pill of its own)
    const line = window.innerHeight * 0.35;
    let current = navSections[0].id;
    for (const section of navSections) {
      if (section.getBoundingClientRect().top <= line) current = section.id;
    }
    if (contactSection.getBoundingClientRect().top <= line) current = null;
    navLinks.forEach((a) => a.classList.toggle("active", a.dataset.nav === current));
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menu-btn");
  const mobileMenu = $("#mobile-menu");

  function setMenu(open) {
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", () => setMenu(mobileMenu.hidden));
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileMenu.hidden) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  window.matchMedia("(min-width: 821px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Typewriter (hero role line) ---------- */
  const typed = $("#typed");
  if (typed && !reduceMotion) {
    const words = JSON.parse(typed.dataset.words);
    let w = 0;
    let i = words[0].length;
    let deleting = true;

    const tick = () => {
      if (deleting) {
        i -= 1;
        typed.textContent = words[w].slice(0, i);
        if (i === 0) {
          deleting = false;
          w = (w + 1) % words.length;
          return setTimeout(tick, 350);
        }
        return setTimeout(tick, 35);
      }
      i += 1;
      typed.textContent = words[w].slice(0, i);
      if (i === words[w].length) {
        deleting = true;
        return setTimeout(tick, 1900);
      }
      return setTimeout(tick, 75);
    };
    setTimeout(tick, 2200);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");

  // Cards and stats in the same group fade in one after another
  revealEls.forEach((el) => {
    if (!el.matches(".card, .stat")) return;
    const group = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(group.indexOf(el), 5) * 70}ms`;
  });

  // Once an element is shown, drop the reveal styles so its own hover transitions apply again
  const settle = (el) => {
    el.addEventListener(
      "transitionend",
      () => {
        el.classList.remove("reveal");
        el.style.transitionDelay = "";
      },
      { once: true }
    );
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          settle(entry.target);
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Timeline line that fills as you scroll ---------- */
  const timeline = $("#timeline");
  const tlItems = $$(".tl-item", timeline);
  const LINE_TOP = 8; // matches .timeline-wrap::before top
  const DOT_CENTER = 13; // .tl-item::before top (5px) + half its 16px height

  function updateTimeline() {
    // Read layout first, then write, to avoid layout thrashing
    const rect = timeline.getBoundingClientRect();
    const lineLen = tlItems[tlItems.length - 1].offsetTop + DOT_CENTER - LINE_TOP;
    const trigger = window.innerHeight * 0.6;
    const progress = Math.min(Math.max(trigger - (rect.top + LINE_TOP), 0), lineLen);
    const dotTops = tlItems.map((li) => li.offsetTop + DOT_CENTER - LINE_TOP);

    timeline.style.setProperty("--line-len", `${lineLen}px`);
    timeline.style.setProperty("--progress", `${progress}px`);
    tlItems.forEach((li, idx) => li.classList.toggle("lit", dotTops[idx] <= progress + 1));
  }

  /* ---------- Accordion (experience) ---------- */
  $$(".acc-item").forEach((item) => {
    const btn = $(".acc-head", item);
    const body = $(".acc-body", item);
    body.inert = !item.classList.contains("open");

    btn.addEventListener("click", () => {
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      body.inert = !open;
    });
  });

  /* ---------- Count-up stats ---------- */
  const counters = $$("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const runCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const start = performance.now();
      const duration = 1400;
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => {
      el.textContent = (0).toFixed(parseInt(el.dataset.decimals || "0", 10));
      cio.observe(el);
    });
  }

  /* ---------- "whoami" terminal popup ---------- */
  const dialog = $("#whoami");
  const termBody = $("#whoami-body");
  const photoBtn = $("#photo-btn");

  const profile = [
    { type: "cmd", text: "whoami" },
    { type: "out", text: "Nathaniel Recto · Computer Engineer, TMU" },
    { type: "gap" },
    { type: "cmd", text: "cat profile.txt" },
    { type: "kv", k: "focus", v: "ML · computer vision · embedded" },
    { type: "kv", k: "building", v: "a basketball shot tracker for iPhone" },
    { type: "kv", k: "stack", v: "Python · C/C++ · Swift · VHDL" },
    { type: "kv", k: "looking for", v: "ML, CV & software roles" },
    { type: "kv", k: "based in", v: "Whitby, ON · EST" },
    { type: "kv", k: "outside code", v: "basketball, the gym, chess & novels" },
    { type: "gap" },
    { type: "prompt" },
  ];

  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };

  let runId = 0; // bumps on every open/close so an old animation stops
  async function playProfile() {
    const id = ++runId;
    const instant = reduceMotion;
    termBody.textContent = "";

    for (const line of profile) {
      if (id !== runId) return;

      if (line.type === "cmd" || line.type === "prompt") {
        const row = make("p", "wa-line");
        const text = make("span", "term-cmd");
        const cursor = make("span", "term-cursor");
        row.append(make("span", "term-prompt", "~"), text, cursor);
        termBody.append(row);
        if (line.type === "prompt") return;

        if (instant) {
          text.textContent = line.text;
        } else {
          await sleep(300);
          for (const ch of line.text) {
            if (id !== runId) return;
            text.textContent += ch;
            await sleep(55);
          }
          await sleep(250);
        }
        cursor.remove();
      } else if (line.type === "out") {
        termBody.append(make("p", "wa-line wa-out", line.text));
        if (!instant) await sleep(220);
      } else if (line.type === "kv") {
        const row = make("p", "wa-line wa-kv");
        row.append(make("span", "k", line.k), make("span", "v", line.v));
        termBody.append(row);
        if (!instant) await sleep(140);
      } else if (line.type === "gap") {
        termBody.append(make("div", "wa-gap"));
      }
    }
  }

  photoBtn.addEventListener("click", () => {
    dialog.showModal();
    playProfile();
  });
  dialog.addEventListener("close", () => {
    runId += 1;
  });
  $("[data-close]", dialog).addEventListener("click", () => dialog.close());
  // Clicking the dimmed backdrop (outside the terminal) closes it
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  /* ---------- Project filter ---------- */
  const filters = $$(".filter");
  const cards = $$("#card-grid .card");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.cat !== filter;
      });
    });
  });

  /* ---------- Card spotlight follows the mouse ---------- */
  $$(".card a").forEach((link) => {
    link.addEventListener("pointermove", (e) => {
      const r = link.getBoundingClientRect();
      link.style.setProperty("--mx", `${e.clientX - r.left}px`);
      link.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Contact form: opens the visitor's email app ---------- */
  const form = $("#contact-form");
  const note = $("#form-note");
  const fields = ["name", "email", "message"].map((n) => form.elements[n]);

  fields.forEach((f) => f.addEventListener("input", () => f.removeAttribute("aria-invalid")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let firstBad = null;
    fields.forEach((f) => {
      const ok = f.value.trim() !== "" && f.checkValidity();
      f.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      note.textContent = "Please add your name, a valid email and a message.";
      note.classList.add("error");
      firstBad.focus();
      return;
    }

    const [name, email, message] = fields.map((f) => f.value.trim());
    const subject = `Portfolio message from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    note.classList.remove("error");
    note.textContent = "Your email app should open with the message ready to send.";
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Wire up scroll / resize ---------- */
  const onScroll = () => {
    updateHeader();
    updateTimeline();
  };
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        onScroll();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  onScroll();
})();
