(function () {
  const relPath = (window.RELATIVE_FILE_PATH || "").trim();
  const preferredName = (window.DOWNLOAD_FILE_NAME || "").trim();
  const manualBtn = document.getElementById("manual");
  const logEl = document.getElementById("log");

  function log(...args) {
    const msg = args.map(String).join(" ");
    console.log("[auto-download]", msg);
    if (logEl) logEl.textContent += msg + "\n";
  }

  if (!relPath) {
    log("❌ RELATIVE_FILE_PATH 가 비어있습니다.");
    return;
  }

  // 현재 페이지의 베이스 경로 계산:
  // - 사용자/조직 페이지: https://username.github.io/  → base = "/"
  // - 프로젝트 페이지:   https://username.github.io/repo/ → base = "/repo/"
  // - /docs 배포:        https://.../repo/ (docs 안으로 빌드되지만 URL은 /repo/)
  function getBasePath() {
    const parts = location.pathname.split("/").filter(Boolean); // ["repo", ...] 또는 []
    if (parts.length === 0) return "/";        // user/org pages root
    // 첫 세그먼트가 리포 이름일 확률이 큼 → "/repo/"
    return "/" + parts[0] + "/";
  }

  // 절대 경로로 변환 (상대 경로 인코딩 포함)
  function toAbsoluteURL(relative) {
    // 캐시 무력화 쿼리 붙이기(CDN 잔존 캐시 회피)
    const cacheBust = "v=" + Date.now();
    // 상대경로의 안전 인코딩 (슬래시는 유지)
    const safeRel = encodeURI(relative);
    const base = getBasePath();
    // location.origin + base + safeRel (중복 슬래시 정리)
    let url = location.origin.replace(/\/+$/, "") + base + safeRel.replace(/^\/+/, "");
    url += (url.includes("?") ? "&" : "?") + cacheBust;
    return url;
  }

  function filenameFromURL(url) {
    try {
      const u = new URL(url);
      const last = u.pathname.split("/").filter(Boolean).pop() || "download";
      return last;
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
    // 후보 URL들:
    const abs = toAbsoluteURL(relPath);             // 권장(베이스 보정)
    const naive = new URL(relPath, location.href).href + "&n=" + Date.now(); // 혹시 모를 대비
    const candidates = [abs, naive];

    log("🔎 후보 URL:");
    candidates.forEach((u, i) => log(`  [${i}] ${u}`));

    const url = await pickWorkingURL(candidates);
    if (!url) {
      log("❌ 어떤 후보도 HEAD 200을 받지 못했습니다. 경로/대소문자/파일 위치를 점검하세요.");
      manualBtn?.classList.remove("hidden");
      manualBtn.onclick = () => open(candidates[0], "_blank");
      return;
    }

    try {
      const res = await fetch(url, { cache: "no-store" });
      log("GET", url, "→", res.status, res.headers.get("content-type") || "(no CT)");
      if (!res.ok) throw new Error(`GET ${res.status}`);

      const blob = await res.blob();

      // 파일명: 지정값 > URL 추출(원본 확장자 보존)
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
