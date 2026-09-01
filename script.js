const projects = document.querySelectorAll(".project");
const gallery = document.querySelector(".gallery");
const brand = document.querySelector(".brand");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;


/* Decorative hand-drawn line behind the floating projects */
const galleryDrawingLine = document.querySelector(".gallery-drawing-line");
const galleryDrawingStartY = -40;
const galleryDrawingEndY = 2340;
let galleryDrawingLength = 0;

function createGalleryDrawing() {
  if (!galleryDrawingLine) return;

  const points = Array.from({ length: 14 }, (_, index) => ({
    x: 90 + Math.random() * 820,
    y: galleryDrawingStartY +
      ((galleryDrawingEndY - galleryDrawingStartY) / 13) * index
  }));

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const midpointX = (point.x + next.x) / 2;
    const midpointY = (point.y + next.y) / 2;

    path += ` Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ` +
      `${midpointX.toFixed(1)} ${midpointY.toFixed(1)}`;
  }

  const lastPoint = points.at(-1);
  path += ` T ${lastPoint.x.toFixed(1)} ${lastPoint.y.toFixed(1)}`;
  galleryDrawingLine.setAttribute("d", path);

  galleryDrawingLength = galleryDrawingLine.getTotalLength();
  galleryDrawingLine.style.strokeDasharray = galleryDrawingLength;
  galleryDrawingLine.style.strokeDashoffset = galleryDrawingLength;
}

function updateGalleryDrawing() {
  if (!gallery || !galleryDrawingLine || !galleryDrawingLength) return;

  if (prefersReducedMotion) {
    galleryDrawingLine.style.strokeDashoffset = 0;
    return;
  }

  const viewportBottom = window.scrollY + window.innerHeight;
  const galleryProgress = Math.max(
    0,
    Math.min(1, (viewportBottom - gallery.offsetTop) / gallery.offsetHeight)
  );
  const targetY = galleryDrawingStartY +
    (galleryDrawingEndY - galleryDrawingStartY) * galleryProgress;

  // Find the point on the curved path that matches the viewport's position.
  // This prevents wide sideways curves from making the drawing fall behind.
  let low = 0;
  let high = galleryDrawingLength;

  for (let index = 0; index < 14; index += 1) {
    const midpoint = (low + high) / 2;
    const point = galleryDrawingLine.getPointAtLength(midpoint);

    if (point.y < targetY) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  galleryDrawingLine.style.strokeDashoffset = galleryDrawingLength - high;
}

createGalleryDrawing();
updateGalleryDrawing();


/*
  Opening fade sequence

  The video appears first. The text and navigation follow shortly afterwards.
  A fallback timer ensures the sequence still runs if the video is slow or absent.
*/
const rootElement = document.documentElement;
const heroVideo = document.querySelector(".hero-video");

function revealVideo() {
  rootElement.classList.add("is-video-visible");
}

function revealText() {
  rootElement.classList.add("is-text-visible");
}

function completeIntro() {
  rootElement.classList.add("is-intro-complete");
  rootElement.classList.remove("is-loading");
}

function startIntroSequence() {
  window.setTimeout(revealVideo, 250);
  window.setTimeout(revealText, 1250);
  window.setTimeout(completeIntro, 2350);
}

if (prefersReducedMotion) {
  rootElement.classList.add(
    "is-video-visible",
    "is-text-visible",
    "is-intro-complete"
  );
  rootElement.classList.remove("is-loading");
} else if (heroVideo) {
  let introStarted = false;

  const startOnce = () => {
    if (introStarted) return;
    introStarted = true;
    startIntroSequence();
  };

  // Start when the first frame is ready.
  heroVideo.addEventListener("loadeddata", startOnce, { once: true });
  heroVideo.addEventListener("canplay", startOnce, { once: true });

  // Fallback for missing, blocked or slow-loading video.
  window.setTimeout(startOnce, 900);
} else {
  startIntroSequence();
}


/*
  Scroll-linked thumbnail movement

  The images react directly to scroll distance and scroll speed.
  Desktop gets a wide floating effect; mobile gets a smaller, stable version.
*/

const floatingProjects = [...projects].map((project, index) => ({
  element: project,
  speed: Number(project.dataset.speed || 0.4),
  phase: index * 1.4,
  x: 0,
  y: 0,
  rotation: 0,
  targetX: 0,
  targetY: 0,
  targetRotation: 0
}));

let lastScrollY = window.scrollY;
let scrollVelocity = 0;
let smoothVelocity = 0;

function getMotionScale() {
  if (window.innerWidth <= 680) return 0.35;
  if (window.innerWidth <= 900) return 0.65;
  return 1;
}

function calculateTargets() {
  if (!gallery || prefersReducedMotion) {
    floatingProjects.forEach((item) => {
      item.targetX = 0;
      item.targetY = 0;
      item.targetRotation = 0;
    });
    return;
  }

  const scale = getMotionScale();
  const galleryTop = gallery.offsetTop;
  const scrollInsideGallery = window.scrollY - galleryTop;
  const waveTime = window.scrollY * 0.006;

  floatingProjects.forEach((item, index) => {
    const alternatingDirection = index % 2 === 0 ? 1 : -1;

    // Main vertical movement follows scrolling.
    const scrollMovement =
      scrollInsideGallery * item.speed * 0.22 * scale;

    // Continuous loose floating movement.
    const horizontalWave =
      Math.sin(waveTime + item.phase) *
      (44 + Math.abs(item.speed) * 38) *
      scale;

    const verticalWave =
      Math.cos(waveTime * 0.72 + item.phase) *
      (24 + Math.abs(item.speed) * 22) *
      scale;

    // Faster scrolling gives the thumbnails a short push.
    const momentumX =
      smoothVelocity *
      alternatingDirection *
      (1.15 + index * 0.12) *
      scale;

    const momentumY =
      smoothVelocity *
      item.speed *
      1.15 *
      scale;

    item.targetX = horizontalWave + momentumX;
    item.targetY = scrollMovement + verticalWave + momentumY;
    item.targetRotation =
      (
        Math.sin(waveTime * 0.45 + item.phase) * 2.2 +
        smoothVelocity * alternatingDirection * 0.035
      ) * scale;
  });
}

function animateProjects() {
  smoothVelocity += (scrollVelocity - smoothVelocity) * 0.14;
  scrollVelocity *= 0.84;

  calculateTargets();

  floatingProjects.forEach((item) => {
    item.x += (item.targetX - item.x) * 0.1;
    item.y += (item.targetY - item.y) * 0.1;
    item.rotation += (item.targetRotation - item.rotation) * 0.09;

    item.element.style.transform =
      `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0) ` +
      `rotate(${item.rotation.toFixed(2)}deg)`;
  });

  window.requestAnimationFrame(animateProjects);
}

function recordScrollSpeed() {
  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastScrollY;

  scrollVelocity = Math.max(-100, Math.min(100, delta));
  lastScrollY = currentScrollY;
  updateGalleryDrawing();
  updateBrandFade();
}

function updateBrandFade() {
  if (!brand) return;

  const fadeDistance = window.innerHeight * 0.55;
  const opacity = Math.max(0, 1 - window.scrollY / fadeDistance);
  brand.style.opacity = opacity;
  brand.style.pointerEvents = opacity > 0.05 ? "auto" : "none";
}

window.addEventListener("scroll", recordScrollSpeed, { passive: true });
window.addEventListener("resize", () => {
  calculateTargets();
  updateGalleryDrawing();
  updateBrandFade();
});

updateBrandFade();
animateProjects();



/*
  Project modal content:
  Change the titles, descriptions and image paths below.
*/
const projectData = {
  "save-the-sharks": {
    number: "Project 01",
    title: "Save The Sharks",
    meta: "Start-up events company / 2026",
    description:
      "Save The Sharks is a startup DJ event company for which I developed the visual identity. The project involved designing a logo and a series of promotional posters that reflect the lively, playful and energetic character of the brand. The visual direction was created to capture the fun, community-driven atmosphere of the events while giving the company a distinctive and recognisable identity.",
    media: [
      { type: "image", src: "images/Save_the_sharks/STS1.jpg" },
      { type: "image", src: "images/Save_the_sharks/STS2.jpg" },
      { type: "image", src: "images/Save_the_sharks/STS3.jpg" },
      { type: "video", src: "video/Project_1vids/STSVid1.mp4" },
      { type: "video", src: "video/Project_1vids/STSvid2.mp4" }
    ]
  },

  "the-canvas-road": {
    number: "Project 02",
    title: "The Canvas Road",
    meta: "Poster / Art Direction / 2026",
    descriptionHtml:
      "As part of his 2026 production <em>The Canvas Road</em>, theatre student Jack Straker commissioned me to create a pair of promotional posters. Set within the context of a touring circus troupe amidst nuclear warfare, the visual outcomes were designed to capture the overtly playful and theatrical qualities of stereotypical circus performer archetypes.",
    media: [
      { type: "image", src: "images/The_canvas_road/TCR_image1.jpg", layout: "half" },
      { type: "image", src: "images/The_canvas_road/TCR2.jpg", layout: "half" }
    ]
  },

  "plage-type-specimen": {
    number: "Project 03",
    title: "Proposed ‘Plage’ Type Specimen",
    meta: "Whisky Label / 2025",
    description:
      "‘Plage’ is a custom typeface designed by French graphic designer Bouk Ra. Its expressive, flowing forms immediately drew comparisons to character-based writing systems such as Japanese. Building on this association, I developed a front-and-back label pair for a whisky bottle, showcasing the typeface within the context of packaging design.",
    media: [
      { type: "image", src: "images/Plage/plage_image1.jpg", layout: "wide" },
      { type: "image", src: "images/Plage/plage_image2.jpg", layout: "half" },
      { type: "image", src: "images/Plage/plage_image3.jpg", layout: "half" }
    ]
  },

  "lionels-cafe": {
    number: "Project 04",
    title: "Proposed Lionel’s Cafe Rebrand",
    meta: "Identity / Branding / 2025",
    description:
      "The identity of Lionel’s Cafe reflects its creative VCA setting through direct, playful imagery. A silhouetted pianist holding a red cup connects performance culture with the café itself, while the red references theatre curtains and warmth. The modern Lemon Milk typeface reinforces the contemporary, progressive character of the University of Melbourne.",
    media: [
      { type: "image", src: "images/Lionels/lionels_image1.png", layout: "wide" },
      { type: "image", src: "images/Lionels/lionels_image2.jpg", layout: "half" },
      { type: "image", src: "images/Lionels/lionels_image3.jpg", layout: "half" }
    ]
  },

  "flow-festival": {
    number: "Project 05",
    title: "Proposed Festival Branding System: ‘Flow Festival’",
    meta: "Branding / Festival / 2025",
    description:
      "As an overt expression of my personal interest in 1960s and 1970s visual media, Flow Festival is a proposed regional Victorian music and arts festival centred around live pop-rock performances. Its visual identity draws from vintage festival posters and psychedelic design, using expressive typography, radiating patterns and the playful illustrated mascot, “Sunny” the sunflower, to create a nostalgic yet energetic aesthetic that reflects the festival’s colourful, communal atmosphere.",
    media: [
      { type: "image", src: "images/Flow/flow_image1.jpg" },
      { type: "image", src: "images/Flow/flow_image2.jpg", layout: "two-thirds" },
      { type: "image", src: "images/Flow/flow_image3.jpg", layout: "half" },
      { type: "image", src: "images/Flow/flow_image4.jpg", layout: "half" },
      { type: "image", src: "images/Flow/flow_image5.jpg", layout: "half" },
      { type: "image", src: "images/Flow/flow_image6.jpg", layout: "half" }
    ]
  }
};

const modal = document.querySelector("#project-modal");
const modalClose = document.querySelector(".modal-close");
const modalCount = document.querySelector("#modal-count");
const modalTitle = document.querySelector("#modal-title");
const modalMeta = document.querySelector("#modal-meta");
const modalDescription = document.querySelector("#modal-description");
const modalMedia = document.querySelector("#modal-media");

let lastFocusedProject = null;

function openProjectModal(projectKey, trigger) {
  const project = projectData[projectKey];

  if (!project || !modal) return;

  lastFocusedProject = trigger;

  modalCount.textContent = project.number;
  modalTitle.textContent = project.title;
  modalMeta.textContent = project.meta;
  if (project.descriptionHtml) {
    modalDescription.innerHTML = project.descriptionHtml;
  } else {
    modalDescription.textContent = project.description;
  }

  const mediaItems = project.media || project.images.map((src) => ({
    type: "image",
    src
  }));

  modalMedia.replaceChildren();

  mediaItems.forEach((item, index) => {
    const figure = document.createElement("figure");
    const media = document.createElement(item.type === "video" ? "video" : "img");

    if (item.type === "video") {
      figure.classList.add("modal-media--video");
    }

    if (item.layout) {
      figure.classList.add(`modal-media--${item.layout}`);
    }

    media.src = item.src;

    if (item.type === "video") {
      media.autoplay = true;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.controls = true;
      media.preload = "metadata";
      media.setAttribute("aria-label", `${project.title} project video ${index + 1}`);
    } else {
      media.alt = `${project.title} project image ${index + 1}`;
      media.loading = "lazy";
    }

    figure.append(media);
    modalMedia.append(figure);
  });

  document.body.classList.add("modal-open");
  modal.showModal();

  // Start each project at the top of the window.
  modal.querySelector(".modal-panel").scrollTop = 0;
}

function closeProjectModal() {
  if (!modal.open) return;

  modal.querySelectorAll("video").forEach((video) => video.pause());

  modal.close();
}

projects.forEach((project) => {
  project.addEventListener("click", (event) => {
    event.preventDefault();
    openProjectModal(project.dataset.project, project);
  });
});

modalClose.addEventListener("click", closeProjectModal);

modal.addEventListener("click", (event) => {
  // Close only when the dark backdrop itself is clicked.
  if (event.target === modal) {
    closeProjectModal();
  }
});

modal.addEventListener("close", () => {
  document.body.classList.remove("modal-open");

  if (lastFocusedProject) {
    lastFocusedProject.focus();
  }
});
