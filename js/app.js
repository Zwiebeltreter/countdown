/***********************************************************
 * ELEMENTE
 ***********************************************************/
const pages        = document.getElementById("pages");
const pagesEls     = document.querySelectorAll(".page");
const dialog       = document.getElementById("settingsDialog");

const titleInput   = document.getElementById("titleInput");
const dateInput    = document.getElementById("dateInput");
const imageInput   = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

const saveBtn      = document.getElementById("saveBtn");
const deleteBtn    = document.getElementById("deleteBtn");
const closeBtn     = document.getElementById("closeBtn");
const settingsBtn  = document.getElementById("settingsBtn");

/* Dots */
const pageDots     = document.getElementById("pageDots");
const PAGE_COUNT   = pagesEls.length;

/***********************************************************
 * STATE
 ***********************************************************/
let countdowns = loadCountdowns();
let editingPageIndex = 0;

/***********************************************************
 * HILFSFUNKTIONEN
 ***********************************************************/
function getCurrentPageIndex() {
  // stabiler als round bei iOS scroll-snap
  const w = pages.clientWidth || 1;
  const idx = Math.floor((pages.scrollLeft + w / 2) / w);
  return Math.max(0, Math.min(PAGE_COUNT - 1, idx));
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function daysLeft(target) {
  if (!target) return "–";
  const today = new Date();
  const t = new Date(target);
  return Math.ceil((t - today) / (1000 * 60 * 60 * 24));
}

/***********************************************************
 * RENDER
 ***********************************************************/
function render() {
  pagesEls.forEach((page, i) => {
    const c = countdowns[i];

    page.style.backgroundImage = c.image
      ? `url(${c.image})`
      : `url(assets/placeholder${i + 1}.jpg)`;

    if (!c.active) {
      page.innerHTML = `
        <div class="title">Kein Countdown</div>
        <div class="days">–</div>
      `;
      return;
    }

    page.innerHTML = `
    <div class="info-box">
        <div class="date">${formatDate(c.targetDate)}</div>
        <div class="title">${c.title}</div>
        <div class="days">${daysLeft(c.targetDate)} Tage</div>
    </div>
    `;
  });
}

/***********************************************************
 * DOTS
 ***********************************************************/
function buildDots() {
  pageDots.innerHTML = "";
  for (let i = 0; i < PAGE_COUNT; i++) {
    const d = document.createElement("div");
    d.className = "dot";
    pageDots.appendChild(d);
  }
}

function updateDots() {
  const idx = getCurrentPageIndex();
  const dots = pageDots.querySelectorAll(".dot");
  dots.forEach((d, i) => d.classList.toggle("active", i === idx));
}

pages.addEventListener("scroll", () => requestAnimationFrame(updateDots));


/***********************************************************
 * BILD VERKLEINERN
 ***********************************************************/
function compressImage(file, maxSize = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


/***********************************************************
 * DIALOG ÖFFNEN / SCHLIESSEN
 ***********************************************************/
settingsBtn.addEventListener("click", () => {
  try {
    editingPageIndex = getCurrentPageIndex();
    const c = countdowns[editingPageIndex];

    // WICHTIG: Save-Button immer aktiv (damit "Foto gewählt → Save disabled" nie passieren kann)
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";

    titleInput.value = c.title || "";
    dateInput.value  = c.targetDate || "";
    imagePreview.src = c.image || "";

    // iOS: damit man auch das gleiche Foto erneut wählen kann
    imageInput.value = "";

    dialog.classList.remove("hidden");
  } catch (err) {
    alert("Fehler beim Öffnen der Einstellungen:\n" + (err?.message || err));
  }
});

closeBtn.addEventListener("click", () => {
  dialog.classList.add("hidden");
});

/***********************************************************
 * FOTO: SOFORT SPEICHERN (kein pending, kein loading)
 ***********************************************************/
imageInput.addEventListener("change", async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;

  const idx = editingPageIndex;

  try {
    // ⭐ Bild verkleinern & komprimieren
    const compressedDataUrl = await compressImage(file);

    countdowns[idx].image = compressedDataUrl;
    imagePreview.src = compressedDataUrl;

    saveCountdowns(countdowns);
    render();

    imageInput.value = "";
  } catch (err) {
    alert("Bild konnte nicht verarbeitet werden.");
  }
});


/***********************************************************
 * UPDATE DER TAGE IMMER UM MITTERNACHT
 ***********************************************************/
function scheduleMidnightUpdate() {
  const now = new Date();

  // nächstes Mitternacht
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );

  const msUntilMidnight = nextMidnight - now;

  // Einmal bis Mitternacht warten
  setTimeout(() => {
    render(); // ⭐ Countdown-Tage neu berechnen

    // Ab dann alle 24 Stunden
    setInterval(() => {
      render();
    }, 24 * 60 * 60 * 1000);

  }, msUntilMidnight);
}


/***********************************************************
 * SPEICHERN (nur Titel/Datum/active, Bild ist bereits gespeichert)
 ***********************************************************/
saveBtn.addEventListener("click", () => {
  try {
    const c = countdowns[editingPageIndex];

    c.title = (titleInput.value || "").trim();
    c.targetDate = dateInput.value || "";
    c.active = true;

    saveCountdowns(countdowns);
    render();

    // iOS: Fokus raus, damit UI sauber reagiert
    document.activeElement?.blur();

    dialog.classList.add("hidden");
  } catch (err) {
    alert("Fehler beim Speichern:\n" + (err?.message || err));
  }
});

/***********************************************************
 * LÖSCHEN
 ***********************************************************/
deleteBtn.addEventListener("click", () => {
  try {
    countdowns[editingPageIndex] = {
      title: "",
      targetDate: "",
      image: null,
      active: false
    };

    saveCountdowns(countdowns);
    render();
    dialog.classList.add("hidden");
  } catch (err) {
    alert("Fehler beim Löschen:\n" + (err?.message || err));
  }
});

/***********************************************************
 * INIT
 ***********************************************************/
render();
buildDots();
updateDots();
// ⭐ Tages-Update aktivieren
scheduleMidnightUpdate();


/***********************************************************
 * Sofortiges Update beim Zurückkehren in die App
 ***********************************************************/
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    render();
  }
});

