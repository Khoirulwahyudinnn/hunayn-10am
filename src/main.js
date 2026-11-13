import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/* ---------------------------------------------------------------
 * HERO — 2 slides on an infinite loop
 * ------------------------------------------------------------- */
const SLIDE_DURATION = 5; // seconds each slide stays on screen
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHero() {
  const slides = gsap.utils.toArray(".hero__slide");
  const contents = gsap.utils.toArray(".hero__content");
  const dots = gsap.utils.toArray(".hero__dot span");
  const total = slides.length;
  let current = 0;
  let progressTween;

  gsap.set(slides[0], { autoAlpha: 1 });
  gsap.set(contents[0], { autoAlpha: 1 });

  function contentIn(el) {
    const items = el.querySelectorAll(".eyebrow, .hero__title, .hero__desc, .hero__ctas");
    return gsap.fromTo(
      items,
      { y: 32, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", stagger: 0.08 }
    );
  }

  function runProgress(index) {
    progressTween?.kill();
    gsap.set(dots, { scaleX: 0 });
    progressTween = gsap.fromTo(
      dots[index],
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: SLIDE_DURATION,
        ease: "none",
        onComplete: () => goTo((index + 1) % total),
      }
    );
  }

  function goTo(next) {
    if (next === current) return;
    const prevSlide = slides[current];
    const nextSlide = slides[next];
    const prevContent = contents[current];
    const nextContent = contents[next];

    gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .set(nextSlide, { autoAlpha: 1, zIndex: 1 })
      .set(prevSlide, { zIndex: 0 })
      .to(
        prevContent.querySelectorAll(".eyebrow, .hero__title, .hero__desc, .hero__ctas"),
        { y: -24, autoAlpha: 0, duration: 0.5, stagger: 0.04, ease: "power2.in" },
        0
      )
      .set(prevContent, { autoAlpha: 0 })
      // curtain reveal of the incoming image
      .fromTo(nextSlide, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2 }, 0.1)
      .fromTo(nextSlide.querySelector(".hero__img"), { scale: 1.2 }, { scale: 1, duration: 1.6, ease: "power2.out" }, 0.1)
      .to(prevSlide.querySelector(".hero__img"), { xPercent: -10, duration: 1.2 }, 0.1)
      .set(prevSlide, { autoAlpha: 0, clearProps: "zIndex" })
      .set(prevSlide.querySelector(".hero__img"), { xPercent: 0 })
      .set(nextContent, { autoAlpha: 1 }, 0.7)
      .add(contentIn(nextContent), 0.7);

    current = next;
    runProgress(next);
  }

  document.querySelectorAll(".hero__dot").forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i));
  });

  // intro
  gsap.from(slides[0].querySelector(".hero__img"), { scale: 1.15, duration: 1.8, ease: "power2.out" });
  contentIn(contents[0]);
  runProgress(0);

  // pause the loop while the hero is off screen
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? progressTween?.resume() : progressTween?.pause()),
  });
}

/* ---------------------------------------------------------------
 * SHOP BY MATERIAL — sticky info, cards drive the title
 * ------------------------------------------------------------- */
const PRODUCTS = [
  {
    name: "Darin دارين",
    material: "Agarwood and resin · Extrait de parfum",
    desc: "Agarwood chips, burned slowly as bakhoor and held in oil. Dry, warm and close to the skin.",
    size: "Spray 50 ml · Oil 12 ml",
    price: "$300",
  },
  {
    name: "Bakhoor بخور",
    material: "Frankincense and amber · Extrait de parfum",
    desc: "Frankincense resin warmed over coal, softened with ambergris. Smoky, sweet and slow.",
    size: "Spray 50 ml · Oil 12 ml",
    price: "$320",
  },
  {
    name: "Ward ورد",
    material: "Taif rose and oud · Extrait de parfum",
    desc: "Taif rose distilled in copper, laid over aged oud. Bright at first, deep by evening.",
    size: "Spray 50 ml · Oil 12 ml",
    price: "$280",
  },
];

function initShop() {
  const info = document.querySelector(".shop__info");
  const fields = {};
  info.querySelectorAll("[data-field]").forEach((el) => (fields[el.dataset.field] = el));
  const swapTargets = [fields.name, fields.material, fields.desc, fields.size, fields.price];
  let active = -1;

  function render(i) {
    Object.entries(PRODUCTS[i]).forEach(([key, value]) => (fields[key].textContent = value));
  }

  function setActive(i) {
    if (i === active) return;
    const dir = i > active ? 1 : -1;
    const first = active === -1;
    active = i;
    if (first) return render(i);

    gsap.killTweensOf(swapTargets);
    gsap
      .timeline()
      .to(swapTargets, { yPercent: -60 * dir, autoAlpha: 0, duration: 0.25, ease: "power2.in", stagger: 0.03 })
      .add(() => render(i))
      .fromTo(
        swapTargets,
        { yPercent: 60 * dir, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.05 }
      );
  }

  setActive(0);

  const cards = gsap.utils.toArray(".card");
  const mm = gsap.matchMedia();

  // Pin the info column for the full height of the card list
  // (CSS sticky can't work inside ScrollSmoother's transformed content)
  mm.add({ desktop: "(min-width: 721px)", mobile: "(max-width: 720px)" }, (ctx) => {
    const top = ctx.conditions.desktop ? 144 : 64; // nav height (+ section top padding on desktop)
    ScrollTrigger.create({
      trigger: info,
      start: `top ${top}px`,
      endTrigger: ".shop__cards",
      end: () => `bottom ${top + info.offsetHeight}px`,
      pin: true,
      pinSpacing: false,
    });
  });

  // Each card takes over the title once it crosses the middle of the viewport
  cards.forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setActive(i),
    });

    // hover: bottle steps back, ingredient rises inside the bottle silhouette
    const ingredient = card.querySelector(".card__ingredient");
    const hover = gsap
      .timeline({ paused: true, defaults: { duration: 0.6, ease: "power3.inOut" } })
      .to(card.querySelector(".card__img"), { autoAlpha: 0, scale: 0.94, duration: 0.45 }, 0)
      .to(ingredient, { clipPath: "inset(0% 0% 0% 0%)" }, 0.05)
      .fromTo(ingredient.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 0.8, ease: "power2.out" }, 0.05);
    card.addEventListener("mouseenter", () => hover.timeScale(1).play());
    card.addEventListener("mouseleave", () => hover.timeScale(1.4).reverse());

    // subtle parallax on the bottle (GSAP owns the centring transform)
    const img = card.querySelector(".card__img");
    gsap.set(img, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    if (reduceMotion) return;
    gsap.fromTo(
      img,
      { yPercent: -46 },
      {
        yPercent: -54,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

// Smoother must exist before any ScrollTrigger is created
ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: reduceMotion ? 0 : 1,
  effects: true,
});

initHero();
initShop();

window.addEventListener("load", () => ScrollTrigger.refresh());
