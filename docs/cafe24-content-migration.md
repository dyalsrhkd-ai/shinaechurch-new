# 카페24 콘텐츠·파일 이전 절차

## 목적

Firebase에 남아 있는 일반 홈페이지 콘텐츠를 읽기 전용으로 백업하고, 문서 ID와 날짜를 유지한 채 카페24 MySQL의 `content_documents`로 옮긴다. 운영 홈페이지 전환 전까지 Firebase 원본은 수정하거나 삭제하지 않는다.

## 1. Firestore 읽기 전용 내보내기

인증정보는 소스나 문서에 적지 않고 실행 중인 PowerShell 환경변수에만 넣는다.

```powershell
$env:FIREBASE_CONFIG_JSON = '{"apiKey":"...","authDomain":"...","projectId":"..."}'
$env:FIREBASE_EMAIL = '기존 Firebase 관리자 이메일'
$env:FIREBASE_PASSWORD = '기존 Firebase 관리자 비밀번호'

node scripts/export-firestore-content.mjs `
  --out migration/firestore-content.json `
  --sql-out migration/firestore-content.sql

Remove-Item Env:FIREBASE_EMAIL
Remove-Item Env:FIREBASE_PASSWORD
```

이 스크립트는 `public/api/_content_service.php`와 동일한 허용 컬렉션만 `getDocs`로 읽는다. Firestore에는 쓰기·수정·삭제 요청을 보내지 않는다.

결과물:

- `firestore-content.json`: 원본 확인·재변환용 백업
- `firestore-content.sql`: 카페24 phpMyAdmin에서 실행할 `content_documents` UPSERT

Firestore `Timestamp`는 ISO 8601 문자열로 변환하고 문서 ID는 그대로 보존한다. SQL의 JSON 본문은 UTF-8 Base64로 넣으므로 한글, 줄바꿈, 따옴표가 깨지지 않는다.

## 2. 카페24 DB 반영

1. 카페24 DB를 먼저 백업한다.
2. `database/cafe24-schema.sql`을 반영한다.
3. phpMyAdmin에서 `firestore-content.sql`을 가져온다.
4. 아래 검증 쿼리로 컬렉션별 건수를 비교한다.

```sql
SELECT collection_key, COUNT(*) AS document_count
  FROM content_documents
 WHERE deleted_at IS NULL
 GROUP BY collection_key
 ORDER BY collection_key;
```

문서 ID 중복 여부:

```sql
SELECT collection_key, document_id, COUNT(*) AS duplicate_count
  FROM content_documents
 GROUP BY collection_key, document_id
HAVING COUNT(*) > 1;
```

두 번째 쿼리는 0건이어야 한다. 운영 전환 직전에는 관리자 수정 시간을 정해 잠시 동결하고 export와 import를 한 번 더 수행한다.

## 3. 이미지·첨부파일 이전

`public/images`에 원본이 있는 파일은 빌드 결과와 함께 카페24 정적 경로로 배포한다. Firebase Storage에만 있는 파일은 다음 순서로 처리한다.

1. Firebase 결제/Storage 접근이 복구되면 원본을 내려받거나, 교회가 보관한 원본 파일을 확보한다.
2. 관리자 화면 또는 `/api/media.php`로 카페24 `/uploads`에 올린다.
3. JSON 안의 `imgUrl`, `fileUrl`, `heroImage`, `logoUrl`, `storagePath`, `fileStoragePath`를 새 URL·경로로 바꾼다.
4. 변경된 JSON으로 SQL을 다시 생성해 반영한다.
5. 공개 페이지에서 이미지와 첨부파일을 전수 확인한다.

현재 Firebase Storage가 결제 오류(HTTP 402)로 막힌 상태라면 서버가 원본 바이트를 읽을 수 없으므로 자동 복사는 불가능하다. 원본 확보 전에는 기존 Firebase 파일을 삭제하지 않는다.

## 4. 전환 검증

- 컬렉션별 문서 수와 문서 ID가 Firebase export와 MySQL에서 일치하는지 확인
- 메인 슬라이드, 공지, 주보, 소식, 갤러리, 설교, 교역자, 시설, 부서 페이지 확인
- 관리자에서 각 유형별 조회·추가·수정·삭제·순서 변경을 1건씩 확인
- 한글 파일명, 한글 본문, 날짜 정렬, 이미지 URL 확인
- 새 PHP 관리자 로그인과 비밀번호 변경 확인
- OBS 라이브 에이전트 5종의 명령 수신·상태 보고 확인

## 5. 전환과 롤백

전환 직전 기존 `dist`, Firestore JSON export, 카페24 DB dump를 보관한다. 실패하면 이전 `dist`와 DB dump를 복원하고 Firebase 기반 홈페이지로 되돌린다. 검증이 끝날 때까지 Firebase 프로젝트와 Storage 원본은 삭제하지 않는다.
