# Cafe24 전환 배포 체크리스트

현재 단계에서는 Cafe24 백엔드 기반만 구현했으며, 기존 Firebase 로그인과 운영 홈페이지는 전환하지 않았다.

## 운영 정보 확인

비밀번호나 키 값은 채팅·Git·문서에 적지 않고 서버 전용 설정 파일에 직접 입력한다.

- Cafe24 PHP 버전
- Cafe24 문서 루트 절대경로
- 웹 루트 밖 private config 절대경로
- DB host / database name / user
- 운영 HTTPS URL
- FTP 또는 SFTP 업로드 루트
- 업로드 파일을 둘 `/uploads` 실제 경로

## 기반 배포 순서

1. phpMyAdmin에서 운영 DB 전체를 SQL로 백업한다.
2. `database/cafe24-schema.sql`을 가져온다.
3. `config/cafe24.example.php`를 복사해 웹 루트 밖에 `shinae-private.php`로 만들고 운영값을 직접 입력한다.
4. 서버 환경변수 `SHINAE_PRIVATE_CONFIG`를 사용할 수 없으면 PHP 기본 경로인 문서 루트의 부모 디렉터리에 설정 파일을 둔다.
5. `public/api`를 Cafe24 문서 루트의 `/api`에 업로드한다.
6. HTTPS에서 로그인·세션·CSRF·관리자 계정 CRUD를 검증한다.
7. 콘텐츠, 미디어, 방송 에이전트 이전이 끝나기 전에는 React의 `AuthContext`와 로그인 화면을 PHP 방식으로 바꾸지 않는다.

## 최종 전환 순서

1. Firestore 전체 데이터를 ID 보존 방식으로 내보내고 MySQL에 가져온다.
2. Firebase Storage 파일을 Cafe24 `/uploads`로 복사하고 URL을 치환한다.
3. React 콘텐츠 API를 Cafe24 PHP API로 전환한다.
4. 5개 방송 PC용 EXE를 Cafe24 agent API 버전으로 교체한다.
5. PHP 관리자 로그인과 `관리자 계정 설정` 화면을 활성화한다.
6. 공개 페이지, 관리자 저장, 이미지 업로드, OBS 시작·종료를 확인한다.
7. 최종 확인 후 Firebase 의존성을 제거한다.

## 보안 확인

- 운영 설정은 웹 루트 밖에 있고 직접 URL로 열리지 않는다.
- 세션 쿠키에 `HttpOnly`, `Secure`, `SameSite=Lax`가 적용된다.
- 비밀번호는 `password_hash()` 결과만 저장된다.
- 관리자 변경 요청은 CSRF 토큰 없이는 실패한다.
- 마지막 활성 관리자와 현재 로그인한 본인은 삭제할 수 없다.
- 기존 EXE 소스에 들어 있던 Firebase 관리자 자격증명과 YouTube API 키는 전환 후 폐기·재발급한다.
- OBS 비밀번호는 각 방송 PC의 로컬 설정 파일에만 둔다.

## 되돌리기

전환 직전의 `dist`, DB SQL 백업, 기존 5개 방송 EXE를 별도 보관한다. 문제가 생기면 이전 `dist`와 기존 EXE를 재배포하고 신규 MySQL 데이터는 삭제하지 않은 채 보존한다.
