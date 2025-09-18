(function () {
  const manualBtn = document.getElementById("manual");
  const logEl = document.getElementById("log");

  // body data-* 속성으로도 받을 수 있도록(실수 예방)
  const attrFile = document.body?.getAttribute("data-file");
  const attrName = document.body?.getAttribute("data-name");

  const relPath = (window.RELATIVE_FILE_PATH || attrFile || "").trim();
  const preferredName = (window.DOWNLOAD_FILE_NAME || attrName || "").trim();

  function log(...args) {
    const msg = args.map(String).join(" ");
    console.log("[auto-download]", msg);
    if (logEl) logEl.textContent += msg + "\n";
  }

  if (!relPath) {
    log("❌ RELATIVE_FILE_PATH 가 비어있습니다. index.html 에서 변수를 먼저 정의해야 합니다.");
    manualBtn?.classList.remove("hidden");
    return;
  }

  // GitHub Pages(Project Pages)에서도 안전한 베이스 경로 계산
  function getBasePath() {
    // pathname: /<repo>/..., 또는 /
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "/";          // 사용자/조직 페이지 루트
    return "/" + parts[0] + "/";                  // /<repo>/
  }

  // 상대경로 → 절대 URL (캐시 버스터 포함)
  function toAbsoluteURL(relative) {
    const safeRel = encodeURI(relative.replace(/^\/+/, "")); // 슬래시 중복 제거 + 인코딩
    const base = getBasePath().replace(/\/+$/, "") + "/";
    let url = location.origin + base + safeRel;
    url += (url.includes("?") ? "&" : "?") + "v=" + Date.now(); // CDN 캐시 무력화
    return url;
  }

  function filenameFromURL(url) {
    try {
      const u = new URL(url);
      const name = u.pathname.split("/").filter(Boolean).pop();
      return name || "download";
    } catch {
      const clean = url.split("?")[0].split("#")[0];
      const parts = clean.split("/");
      return parts[parts.length - 1] || "download";
    }
  }

  async function headOK(url) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok ? r : null;
    } catch { return null; }
  }

  async function pickWorkingURL(candidates) {
    for (const c of candidates) {
      const r = await headOK(c);
      log("HEAD", c, r ? `→ ${r.status}` : "→ (network error)");
      if (r && r.ok) return c;
    }
    return null;
  }

  async function triggerDownload() {
    // 후보 URL: (1) 베이스 보정 절대경로, (2) 브라우저가 계산한 상대→절대
    const abs = toAbsoluteURL(relPath);
    const naive = new URL(relPath, location.href).href + (relPath.includes("?") ? "&" : "?") + "n=" + Date.now();
    const candidates = [abs, naive];

    log("🔎 후보 URL:");
    candidates.forEach((u, i) => log(`  [${i}] ${u}`));

    const url = await pickWorkingURL(candidates);
    if (!url) {
      log("❌ 어떤 후보도 HEAD 200을 받지 못했습니다.");
      log("   · 파일 경로/대소문자 정확히 일치하는지 확인");
      log("   · Pages 배포 루트(루트 vs /docs)와 파일 위치 일치 확인");
      manualBtn?.classList.remove("hidden");
      manualBtn.onclick = () => open(candidates[0], "_blank");
      return;
    }

    try {
      const res = await fetch(url, { cache: "no-store" });
      log("GET", url, "→", res.status, res.headers.get("content-type") || "(no content-type)");
      if (!res.ok) throw new Error(`GET ${res.status}`);

      const blob = await res.blob();

      // 파일명: 사용자가 지정 > URL에서 추출(원래 확장자 유지)
      const finalName = preferredName || filenameFromURL(url);
      log("⬇️ 저장 파일명:", finalName);

      const objURL = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objURL;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objURL), 0);
    } catch (e) {
      log("❌ 다운로드 중 오류:", e && e.message ? e.message : e);
      manualBtn?.classList.remove("hidden");
      manualBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = preferredName || filenameFromURL(url);
        document.body.appendChild(a);
        a.click();
        a.remove();
      };
    }
  }

  window.addEventListener("DOMContentLoaded", triggerDownload);
})();
