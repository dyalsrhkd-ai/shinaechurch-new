# 카페24 콘텐츠 DB·API 이전 설계

## 목표

현재 Firestore에 저장된 홈페이지 콘텐츠와 관리자 수정 기능을 카페24 MySQL·PHP API로 이전한다. 기존 공개 화면과 관리자 화면의 데이터 형태와 동작은 유지하고, 최종 전환 후 Firebase SDK 없이 홈페이지가 동작하게 한다.

## 현재 확인된 범위

현재 React 화면은 공지, 주보, 소식, 갤러리, 동영상, 설교, 새가족, 선교, 텃밭, 인사말, 연혁, 일정, 예배, 오시는 길, 시설, 교역자, 부서 콘텐츠, 기본 설정 등을 Firestore에서 읽고 쓴다.

관리자 저장 권한은 `firestore.rules`의 Firebase 로그인 상태에 의존한다. 따라서 Firestore만 먼저 끊거나 Firebase Auth만 먼저 끊지 않고, 카페24 API와 PHP 인증을 모두 준비한 뒤 한 번의 전환 배포에서 교체한다.

## 데이터 저장 방식

일반 홈페이지 콘텐츠는 화면별 테이블을 수십 개 만들지 않고 `content_documents` 공통 테이블에 JSON 문서로 저장한다. 현재 Firestore 문서 구조를 거의 그대로 유지하여 React 변경과 데이터 변환을 줄인다.

### `content_documents`

| 컬럼 | 용도 |
|---|---|
| `collection_key` | 기존 Firestore 컬렉션명 |
| `document_id` | 기존 Firestore 문서 ID |
| `data_json` | UTF-8 JSON 문자열 |
| `sort_order` | `order` 기반 정렬용 숫자 |
| `sort_date` | `date` 기반 정렬용 문자열 |
| `created_at` | 생성 일시 |
| `updated_at` | 수정 일시 |
| `version_no` | 충돌 확인용 버전 |

PK는 `(collection_key, document_id)`를 사용한다. `data_json`은 MySQL 버전에 관계없이 동작하도록 `LONGTEXT`로 만들고 PHP에서 JSON 유효성을 검사한다.

### 별도 운영 테이블

문서 CRUD와 성격이 다른 데이터는 별도 테이블로 둔다.

- `visitor_daily_stats`, `visitor_logs`: 방문 통계와 로그
- `admin_activity_logs`: 관리자 작업 로그
- `admin_route_locks`: 동일 화면 동시 편집 방지
- 관리자 인증 테이블: 관리자 인증 설계 문서 기준
- 라이브 설정·명령·에이전트 테이블: 라이브 에이전트 설계 문서 기준

## 콘텐츠 API

같은 도메인의 `/api/content.php`를 사용한다.

### 공개 조회

- 단건: `GET /api/content.php?collection=<key>&id=<id>`
- 목록: `GET /api/content.php?collection=<key>&sort=<order|date>&direction=<asc|desc>&limit=<n>`

서버에 등록된 공개 컬렉션만 비로그인 조회를 허용한다. API 요청에 임의 SQL 컬럼이나 테이블명을 전달하지 않는다.

### 관리자 변경

- 생성: `POST action=create`
- 전체 저장: `POST action=upsert`
- 일부 수정: `POST action=update`
- 삭제: `POST action=delete`
- 순서 일괄 변경: `POST action=reorder`

변경 요청은 PHP 관리자 세션과 CSRF 검증을 통과해야 한다. 서버는 컬렉션 allowlist, 문서 ID 형식, JSON 크기와 타입을 검증하고 PDO prepared statement만 사용한다.

## React 공통 모듈

`src/api/contentApi.js`가 다음 함수를 제공한다.

- `getContentDocument(collectionKey, documentId)`
- `listContentDocuments(collectionKey, options)`
- `createContentDocument(collectionKey, data)`
- `upsertContentDocument(collectionKey, documentId, data, versionNo)`
- `updateContentDocument(collectionKey, documentId, patch, versionNo)`
- `deleteContentDocument(collectionKey, documentId)`
- `reorderContentDocuments(collectionKey, rows)`

Firestore SDK를 흉내 내는 범용 호환 계층은 만들지 않는다. 화면이 사용하는 위 CRUD만 제공하고 각 화면에서 기존 Firestore 호출을 명시적으로 교체한다.

## 실시간 기능 대체

일반 콘텐츠는 저장 빈도가 낮으므로 Firestore `onSnapshot`을 사용하지 않고 조회 시 GET 요청을 수행한다.

- 기본 설정: 최초 로딩과 관리자 저장 후 재조회
- 활동 로그와 방문 통계: 관리자 화면 진입 시 조회, 필요 시 새로고침
- 관리자 화면 잠금: 주기적 heartbeat 요청
- 라이브 상태: 라이브 설계에 정의한 짧은 polling 사용

## 데이터 이전

1. 현재 Firestore 컬렉션을 읽기 전용 JSON 파일로 내보낸다.
2. Firestore Timestamp는 ISO 8601 문자열로 변환한다.
3. 문서 ID와 컬렉션명을 보존한다.
4. Firebase Storage URL과 경로는 카페24 `/uploads` 이전 결과로 치환한다.
5. JSON을 MySQL `content_documents`에 import한다.
6. 컬렉션별 문서 수, 문서 ID, 주요 필드, 이미지 URL을 원본과 대조한다.
7. 실제 전환 직전에 최종 export/import를 한 번 더 수행한다.

관리자 세션과 화면 잠금처럼 일시적인 데이터는 이전하지 않는다. 방문 통계와 관리자 활동 로그는 보존 대상으로 별도 export한다.

## 전환 방식

개발 중인 PHP API 코드는 운영 화면에서 호출하지 않는다. 다음 항목이 모두 준비된 뒤 한 번의 전환 배포를 수행한다.

- 카페24 DB 스키마와 비공개 설정 파일
- 콘텐츠·통계·로그·잠금·라이브·인증 API
- Firestore 데이터 최종 import
- React의 모든 Firebase 호출 교체
- 신규 라이브 EXE 설치와 통신 확인
- 관리자 임시 계정 생성

전환 직전 기존 `dist`, Firestore export, MySQL dump를 보관한다. 실패 시 이전 `dist`를 재배포하여 Firebase 방식으로 즉시 되돌린다.

## 보안

- DB 비밀번호와 API 비밀값은 웹 루트 밖 PHP 설정 파일에 둔다.
- 모든 관리자 변경 요청은 PHP 세션과 CSRF를 검증한다.
- 공개 API는 읽기만 허용하며 컬렉션 allowlist를 적용한다.
- 요청 크기와 JSON 깊이를 제한한다.
- 에러 응답에 SQL, 파일 경로, DB 접속정보를 노출하지 않는다.
- 운영은 HTTPS만 사용한다.

## 검증

- Firestore 원본과 MySQL 문서 수·ID 전수 비교
- 주요 공개 페이지의 텍스트·정렬·이미지 대조
- 모든 관리자 화면의 조회·추가·수정·삭제·순서 저장
- 동시 수정 시 `version_no` 충돌 안내
- 방문 통계와 관리자 활동 로그 기록
- 비로그인 변경 요청, 잘못된 CSRF, 임의 컬렉션 요청 차단
- UTF-8 한글과 첨부파일명 보존
- 기존 production build와 카페24 실제 URL 점검

## 제외 범위

- 검색엔진이나 별도 CMS 도입
- 화면별 정규화 테이블
- GraphQL
- Redis나 메시지 큐
- Firebase와 카페24의 장기 이중 운영

