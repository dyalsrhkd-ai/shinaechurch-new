# 카페24 미디어 저장소 전환 설계

## 목표

관리자 화면의 사용 방법과 Firestore 문서 구조는 유지하면서 이미지·첨부파일 저장소만 Firebase Storage에서 카페24 웹호스팅의 `/uploads`로 전환한다. Firebase Auth와 Firestore는 계속 사용한다.

## 선택한 방식

카페24에 PHP 업로드 API를 배포하고 React 관리자 화면이 HTTPS로 파일을 전송한다. 브라우저에서 FTP로 직접 접속하지 않는다.

- 브라우저 FTP 직접 전송: 최신 브라우저 지원 부재와 FTP 자격증명 노출 때문에 제외한다.
- Supabase Storage 전환: Auth·Storage SDK와 데이터 이관 범위가 커서 제외한다.
- 카페24 PHP API: 기존 호스팅을 그대로 쓰고 저장 계층만 교체할 수 있어 채택한다.

## 구성

### 카페24 서버

`public/api/media.php`를 두며 Vite 빌드 시 `dist/api/media.php`로 복사한다.

지원 기능:

- `POST action=upload`: 파일을 `/uploads/<업무폴더>/`에 저장하고 공개 URL과 상대 경로를 반환한다.
- `POST action=delete`: `/uploads` 아래의 지정 파일만 삭제한다.
- 업로드 폴더는 현재 사용 중인 `slides`, `gallery`, `news`, `notices`, `bulletins`, `facility`, `farm`, `greeting`, `missions`, `newcomers`, `page-content`, `site-assets`, `staff`만 허용한다.
- 파일명은 서버에서 충돌하지 않는 이름으로 생성하고 원본 확장자만 보존한다.
- 경로 이동 문자열과 허용되지 않은 확장자·MIME·용량은 서버에서 거부한다.

### 인증

관리자 브라우저가 현재 Firebase 로그인 사용자의 ID 토큰을 `Authorization: Bearer` 헤더로 전달한다. PHP는 Firebase Auth에 토큰 유효성을 확인하고 현재 관리자 계정 allowlist에 포함된 사용자만 허용한다. FTP 계정과 비밀번호는 브라우저·번들·Firestore에 저장하지 않는다.

### React 공통 모듈

`src/utils/mediaStorage.js` 한 곳에서 다음 기능을 제공한다.

- 파일 업로드 및 진행률 전달
- 파일 삭제
- 서버 오류 메시지 정규화
- 반환값 `{ url, path }` 제공

업로드 진행률이 있는 기존 화면을 유지하기 위해 브라우저 기본 `XMLHttpRequest`를 사용한다. 새 라이브러리는 추가하지 않는다.

## 데이터 호환성

Firestore의 기존 필드명은 변경하지 않는다.

- `imgUrl`, `fileUrl`, `heroImage`, `logoUrl`: 카페24의 절대 HTTPS URL 저장
- `storagePath`, `fileStoragePath`: `uploads/...` 상대 경로 저장

기존 조회 화면은 URL을 그대로 렌더링하므로 별도 조회 로직 변경 없이 동작한다. 삭제 시 `uploads/`로 시작하는 카페24 경로만 PHP API로 삭제하고, 기존 Firebase 경로는 이관 완료 전까지 건드리지 않는다.

## 기존 파일 이관

1. `public/images`에 원본이 있는 로고·기본·레거시 이미지는 카페24 정적 경로로 연결한다.
2. Firebase Storage에만 존재하는 파일은 결제 계정을 일시 복구해 내려받거나 원본 파일을 다시 확보한 뒤 카페24 `/uploads`에 올린다.
3. 업로드된 카페24 URL과 경로로 관련 Firestore 문서를 갱신한다.
4. Firestore에서 Firebase Storage URL이 더 이상 사용되지 않는지 전수 조회한다.

Firebase Storage가 현재 402로 차단되어 있으므로 2번 파일은 Blaze 복구 또는 원본 확보 없이는 자동 이관할 수 없다.

## 파일 제한

현재 클라이언트 정책을 유지하고 PHP에서도 같은 기준을 검사한다.

- 이미지: JPG, JPEG, PNG, 최대 10MB
- 문서: PDF, HWP, HWPX, DOC, DOCX, XLS, XLSX, PPT, PPTX, 최대 200MB

카페24의 PHP `upload_max_filesize` 또는 `post_max_size`가 200MB보다 작으면 서버 허용치까지 첨부파일 한도를 낮추고 화면 안내도 같은 값으로 맞춘다.

## 변경 범위

Firebase Storage 업로드를 사용하는 관리자 화면 14개와 삭제를 사용하는 화면 9개를 공통 모듈로 전환한다. 완료 후 `src/firebase.js`에서 더 이상 사용하지 않는 Storage 초기화를 제거한다.

## 오류 처리

- 인증 실패: 다시 로그인하라는 메시지 표시
- 파일 검증 실패: 허용 형식과 최대 용량 표시
- 서버 저장 실패: Firestore 문서를 저장하지 않고 오류 표시
- Firestore 저장 실패: 방금 업로드한 카페24 파일을 삭제해 고아 파일을 남기지 않는다.
- 파일 삭제 실패: 문서 삭제를 막거나 실패 사실을 표시해 데이터와 파일 상태가 어긋나지 않게 한다.

## 배포

`npm run build` 후 `dist` 내부 전체를 카페24 웹 루트에 덮어쓴다. 숨김 파일 `.htaccess`와 `api/media.php`도 포함한다.

원격 `/uploads`는 운영 데이터이므로 FTP 미러 삭제를 사용하지 않는다. 배포는 덮어쓰기만 수행하고 `/uploads`를 보존한다. PHP는 필요한 하위 폴더가 없으면 생성한다.

## 검증

- PHP 업로드·삭제 API 인증, 확장자, MIME, 용량, 경로 이동 차단 테스트
- 공통 업로드 모듈의 성공·실패·진행률 테스트
- 관리자 14개 화면별 업로드와 수정 확인
- 삭제 기능이 있는 9개 화면별 파일 삭제 확인
- 로고, 메인 슬라이드, 게시물, 부서 페이지, 첨부파일 공개 URL 확인
- ESLint, 기존 테스트, production build 통과
- 카페24 배포 후 새 업로드 파일이 `/uploads`에 생성되고 새로고침 후에도 표시되는지 확인

