(function () {
  const filePath = window.DOWNLOAD_FILE_PATH || "assets/my-image.jpg";
  const fileName = window.DOWNLOAD_FILE_NAME || "download.jpg";
  const manualBtn = document.getElementById("manual");

  async function triggerDownload() {
    try {
      // 1) Blob으로 받아서 강제로 저장(사파리 등 호환 ↑)
      const res = await fetch(filePath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch file: " + res.status);
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName; // 저장 파일명 지정
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      // 2) 실패 시 a[download]로 직접 시도 (동일 출처일 때 잘 동작)
      console.warn("[auto-download] blob 방식 실패, fallback 시도:", e);
      const a = document.createElement("a");
      a.href = filePath;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // 여전히 차단되면 수동 버튼 노출
      manualBtn?.classList.remove("hidden");
    }
  }

  // 팝업/다운로드 차단시 수동 트리거
  manualBtn?.addEventListener("click", triggerDownload);

  // 첫 방문에만 자동 다운로드 하고 싶으면 주석 해제
  // const FIRST_ONLY = true;
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
