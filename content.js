(function () {
  if (document.getElementById("chatLoaderPanel")) return;

  // --- Disable body scroll when panel is open ---
  document.body.style.overflow = "hidden";

  // --- Inject Bootstrap CSS ---
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
  document.head.appendChild(link);

  // --- UI: Floating panel ---
  const panel = document.createElement("div");
  panel.id = "chatLoaderPanel";
  panel.className = "position-fixed top-0 end-0 bg-white border rounded shadow-lg d-flex flex-column";
  panel.style.width = "100%";
  panel.style.height = "100%";
  panel.style.zIndex = "999999";

  const controls = document.createElement("div");
  controls.className = "p-2 border-bottom d-flex flex-wrap align-items-end gap-2";
  controls.innerHTML = `
    <div class="d-flex flex-column flex-grow-1">
      <label class="form-label small mb-1">Last Date & Time</label>
      <input type="datetime-local" id="endDate" class="form-control form-control-sm"/>
    </div>
    <button id="loadBtn" class="btn btn-primary btn-sm">Load</button>
  `;

  const chatBox = document.createElement("div");
  chatBox.id = "chatBox";
  chatBox.className = "flex-grow-1 p-2 overflow-auto bg-light d-flex flex-column gap-2";
  chatBox.style.scrollBehavior = "smooth";

  // "Load More" button
  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.id = "loadMoreBtn";
  loadMoreBtn.className = "btn btn-outline-secondary btn-sm w-100";
  loadMoreBtn.textContent = "Load More (Older)";
  loadMoreBtn.style.display = "none";

  // Scroll-to-Top button
  const scrollTopBtn = document.createElement("button");
  scrollTopBtn.id = "scrollTopBtn";
  scrollTopBtn.className = "btn btn-secondary rounded-circle shadow";
  scrollTopBtn.style.position = "absolute";
  scrollTopBtn.style.bottom = "20px";
  scrollTopBtn.style.right = "20px";
  scrollTopBtn.style.zIndex = "1000000";
  scrollTopBtn.style.display = "none";
  scrollTopBtn.innerHTML = "↑";
  scrollTopBtn.addEventListener("click", () => {
    chatBox.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Show/hide scrollTopBtn
  chatBox.addEventListener("scroll", () => {
    scrollTopBtn.style.display = chatBox.scrollTop > 300 ? "block" : "none";
  });

  panel.append(controls, loadMoreBtn, chatBox, scrollTopBtn);
  document.body.appendChild(panel);

  // --- Prefill end date with now ---
  const endInput = controls.querySelector("#endDate");
  endInput.value = toDatetimeLocalValue(new Date());

  // State
  let messagesState = [];
  let earliestMs = null;

  // --- Helpers ---
  function toDatetimeLocalValue(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function toMs(v) {
    if (!v) return null;
    if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v) < 1e12 ? Number(v) * 1000 : Number(v);
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  function getMsgMs(msg) {
    return toMs(msg.createdAt ?? msg.updatedAt ?? msg.timestamp ?? msg.created_at ?? msg.time ?? msg.date);
  }
  function fmt(ms) {
    return ms ? new Date(ms).toLocaleString() : "";
  }
  function pickImageUrl(att) {
    const pv = att.preview_urls || {};
    const wpv = att.watermarked_preview_urls || {};
    return (
      pv.thumb_large ||
      pv.large ||
      pv.original ||
      wpv.thumb_large ||
      wpv.large ||
      wpv.original ||
      att.watermarked_download_url ||
      att.download_url ||
      (att.download_relative_url ? `https://www.fiverr.com${att.download_relative_url}` : null)
    );
  }

  function renderMessages(newMsgs, contactUsername, { append = false } = {}) {
    newMsgs.sort((a, b) => (getMsgMs(a) ?? 0) - (getMsgMs(b) ?? 0));

    newMsgs.forEach((msg) => {
      if (!messagesState.some((m) => m.id === msg.id)) {
        messagesState.push(msg);

        const isClient = (msg.sender || "").toLowerCase() === (contactUsername || "").toLowerCase();
        const wrapper = document.createElement("div");
        wrapper.className = "d-flex";
        wrapper.style.justifyContent = isClient ? "flex-start" : "flex-end";

        const bubble = document.createElement("div");
        bubble.className = (isClient ? "bg-white border " : "bg-primary text-white ") + "rounded p-2";
        bubble.style.maxWidth = "75%";
        bubble.style.wordBreak = "break-word";

        if (msg.body) {
          const body = document.createElement("div");
          body.textContent = msg.body;
          bubble.appendChild(body);
        }

        if (Array.isArray(msg.attachments)) {
          msg.attachments.forEach((att) => {
            const url = pickImageUrl(att);
            const isImage = att.preview_type === "image" || (att.content_type || "").startsWith("image/");
            if (isImage && url) {
              const img = document.createElement("img");
              img.src = url;
              img.className = "img-fluid rounded mt-2";
              img.style.maxWidth = "220px";
              img.style.cursor = "pointer";
              img.addEventListener("click", () => window.open(url, "_blank"));
              bubble.appendChild(img);
            } else if (url) {
              const a = document.createElement("a");
              a.href = url;
              a.target = "_blank";
              a.rel = "noreferrer";
              a.className = "d-inline-block small mt-2";
              a.textContent = att.file_name || "Attachment";
              bubble.appendChild(a);
            }
          });
        }

        const ms = getMsgMs(msg);
        const time = document.createElement("div");
        time.className = "text-muted small mt-1";
        time.textContent = fmt(ms);
        bubble.appendChild(time);

        wrapper.appendChild(bubble);

        if (append) {
          chatBox.insertBefore(wrapper, chatBox.firstChild); // prepend older
        } else {
          chatBox.appendChild(wrapper);
        }
      }
    });

    const allMs = messagesState.map(getMsgMs).filter(Boolean);
    earliestMs = allMs.length ? Math.min(...allMs) : null;

    //chatBox.scrollTop = chatBox.scrollHeight;
    loadMoreBtn.style.display = earliestMs ? "block" : "none";
  }

  // --- Load fresh messages ---
  document.getElementById("loadBtn").addEventListener("click", async () => {
    const endMs = toMs(endInput.value);
    if (!endMs) return alert("Invalid end date/time");

    const contactUsername = (window.location.pathname || "").split("/")[3] || "";
    const url = `https://www.fiverr.com/inbox/contacts/${encodeURIComponent(contactUsername)}/conversation?timestamp=${endMs}`;

    chatBox.innerHTML = '<div class="text-center text-muted small">Loading…</div>';
    messagesState = [];

    try {
      const res = await fetch(url, { credentials: "include" });
      const text = await res.text();
      const data = JSON.parse(text.match(/{[\s\S]*}/)?.[0] || text);
      chatBox.innerHTML = "";
      renderMessages(data.messages || [], contactUsername);
    } catch (err) {
      console.error("Load error:", err);
    }
  });

  // --- Load older messages ---
  loadMoreBtn.addEventListener("click", async () => {
    if (!earliestMs) return;
    const contactUsername = (window.location.pathname || "").split("/")[3] || "";
    const url = `https://www.fiverr.com/inbox/contacts/${encodeURIComponent(contactUsername)}/conversation?timestamp=${earliestMs - 1000}`;

    loadMoreBtn.textContent = "Loading older…";

    try {
      const res = await fetch(url, { credentials: "include" });
      const text = await res.text();
      const data = JSON.parse(text.match(/{[\s\S]*}/)?.[0] || text);
      renderMessages(data.messages || [], contactUsername, { append: true });
    } catch (err) {
      console.error("Older load error:", err);
    } finally {
      loadMoreBtn.textContent = "Load More (Older)";
    }
  });
})();
