<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Auto Download</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.5; padding: 24px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .muted { color: #666; font-size: 14px; }
    .hidden { display: none; }
    .err { color:#c00; white-space:pre-wrap; font-size:13px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>파일 준비 중…</h1>
    <p class="muted">접속 시 자동으로 다운로드합니다. 차단되면 아래 버튼으로 시도하세요.</p>
    <p><button id="manual" class="hidden">수동으로 다운로드</button></p>
    <pre id="log" class="err"></pre>
  </div>

  <!-- ✅ 반드시 download.js 보다 '먼저' 정의하세요 -->
  <script>
    // 리포 안에서의 '정확한 상대경로/대소문자'를 입력
    window.RELATIVE_FILE_PATH = "assets/my-image.jpeg";
    // 원본명 유지하려면 빈 문자열, 바꾸고 싶으면 "원하는이름.jpeg"
    window.DOWNLOAD_FILE_NAME = "";
  </script>

  <!-- 변수 설정 다음 줄에 download.js를 넣어야 함 -->
  <script src="./download.js"></script>
</body>
</html>
