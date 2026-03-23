# GitHub Pages Deployment

## 정적 출력

이 프로젝트는 `output: "export"`로 설정되어 있습니다.
빌드 결과물은 `out/` 디렉터리에 생성됩니다.

```bash
npm install
npm run build:pages
```

## GitHub Pages 프로젝트 사이트 경로

현재 설정은 repository 이름 기준 경로를 사용합니다.

- basePath: `/family_QT`
- assetPrefix: `/family_QT/`

즉 GitHub Pages project site를 기준으로 정적 파일이 맞춰집니다.

## Apps Script 런타임 읽기 설정

GitHub Pages는 서버 런타임이 없으므로 production read path는 브라우저가 직접 Apps Script를 읽습니다.
빌드 시 아래 환경 변수를 넣어야 합니다.

```bash
NEXT_PUBLIC_APPS_SCRIPT_WEBAPP_URL=...
```

권장 방식은 GitHub Actions 또는 Pages 배포 워크플로 빌드 환경에 넣는 것입니다.

## GitHub Pages 배포 순서

1. GitHub repository의 Pages 설정을 `GitHub Actions` 또는 `Deploy from a branch` 방식으로 준비합니다.
2. 배포 전에 `npm run build:pages`를 실행합니다.
3. 생성된 `out/` 디렉터리를 Pages에 게시합니다.

`Deploy from a branch`를 쓰는 경우:

1. `out/` 내용을 `gh-pages` 브랜치 같은 정적 배포 브랜치에 올립니다.
2. Pages source를 해당 브랜치 root로 지정합니다.

## 개발 모드

- `npm run dev`
- development에서는 mock 데이터가 기본입니다.
- 작은 data indicator가 보이면 현재 source가 `mock`인지 확인할 수 있습니다.
- production에서는 `NEXT_PUBLIC_APPS_SCRIPT_WEBAPP_URL`이 있으면 Apps Script를 우선 사용합니다.

## 현재 제약

- detail route는 static export 호환을 위해 `/entry?id=...`로 단순화했습니다.
- write path는 아직 Apps Script 저장으로 연결하지 않았습니다.
- admin write도 아직 mock-only입니다.
