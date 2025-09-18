(function () {
  const rawPath = (window.DOWNLOAD_FILE_PATH || "assets/my-image.jpeg").trim();
  const preferredName = (window.DOWNLOAD_FILE_NAME || "").trim();
  const manualBtn = document.getElementById("manual");
  const logEl = document.getElementById("log");

  function log(msg) {
    if (!logEl) return;
    logEl.textContent = (logEl.textContent ? logEl.textContent + "\n" : "") + msg;
    logEl.classList.remove("hidden");
  }

  // URL 인코딩 (공백, 한글, 특수문자 등)
  // 상대경로 유지: encodeURI는 /는 그대로 두고 나머지만 인코딩
  const filePath = encodeURI(rawPath);

  // URL에서 원래 파일명 추출 (확장자 포함)
  function filenameFromURL(url) {
    try {
      const u = new URL(url, location.href);
      const last = u.pathname.split("/").filter(Boolean).pop() || "download";
      return last;
    } catch {
      // 상대경로일 경우 간단 파서
      const parts = url.split("?")[0].split("#")[0].split("/");
      return (parts[parts.length - 1] || "download").trim() || "download";
    }
  }

  async function triggerDownload() {
    try {
      // 1) HEAD로 존재/경로 확인 (404 조기 감지, 대소문자 문제 진단)
      const headRes = await fetch(filePath, { method: "HEAD", cache: "no-store" });
      if (!headRes.ok) {
        throw new Error(`HEAD ${headRes.status} — 경로/대소문자를 확인하세요: ${filePath}`);
      }

      // 2) Blob으로 받아 강제 저장 (파일명은 기본적으로 원래 이름 사용)
      const res = await fetch(filePath, { cache: "no-store" });
      if (!res.ok) throw new Error(`GET ${res.status} — 파일을 받을 수 없습니다: ${filePath}`);
      const blob = await res.blob();

      // 파일명 결정 우선순위: 사용자가 강제 지정 > URL에서 추출
      const finalName = preferredName || filenameFromURL(filePath);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName; // 원래 확장자(.jpeg 등) 그대로 보존
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      log(`[auto-download] 오류: ${e.message || e}`);
      // 3) fallback: 직접 링크 제공 (차단/호환 이슈 대비)
      manualBtn?.classList.remove("hidden");
      manualBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = filePath;
        a.download = preferredName || filenameFromURL(filePath);
        document.body.appendChild(a);
        a.click();
        a.remove();
      };
    }
  }

  // 첫 방문만 실행하려면 true
  const FIRST_ONLY = false;

  window.addEventListener("DOMContentLoaded", () => {
    if (FIRST_ONLY) {
      const key = "auto_down_once";
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        triggerDownload();
      } else {
        manualBtn?.classList.remove("hidden");
      }
    } else {
      triggerDownload();
    }
  });
})();
