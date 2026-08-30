# 송도 천년의미소 미술학원 운영 사이트

정적 GitHub Pages 사이트 + 네이버 블로그 자동 수집 구성입니다.

## 핵심 변경점
- 메인을 학원 소개/교육 시스템/교육 과정 중심의 운영 사이트 구조로 개편
- 네이버 블로그는 `NEWS & CONTENT` 영역으로 노출
- 크롤링 단계에서 네이버 썸네일을 `assets/blog/`에 직접 저장
- JSON에는 외부 이미지 URL 대신 로컬 이미지 경로를 저장하여 썸네일 누락/외부 차단 문제 완화
- 로컬 이미지가 없는 기존 캐시는 다시 크롤링
- 이미지가 최종적으로 없어도 홈페이지에서 브랜드 플레이스홀더 표시

## 업로드 후 최초 실행
1. GitHub 저장소의 `Actions` 탭으로 이동
2. `Update Naver Blog` 선택
3. `Run workflow` 실행
4. 완료 후 `data/posts.json`과 `assets/blog/`에 데이터/이미지가 커밋되는지 확인

## GitHub Pages
Settings → Pages → Deploy from a branch → `main` / `/ (root)` 선택.

## 로컬 실행
```bash
npm install
npm run import:naver
python3 -m http.server 8080
```
브라우저에서 http://localhost:8080 접속.
