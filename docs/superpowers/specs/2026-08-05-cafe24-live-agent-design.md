# 카페24 라이브 EXE·OBS 연동 설계

## 목표

현재 송출 PC에 설치된 부서별 EXE와 OBS·Chrome·YouTube 자동화 동작은 유지하면서, Firebase 명령 구독과 상태 저장을 카페24 PHP API·MySQL로 교체한다.

## 현재 동작 확인

빌드 스크립트는 Node 16 Windows x64 대상으로 다음 EXE 5개를 만든다.

- 아동부
- 중고등부
- 청년부
- 중고등부·청년부 통합
- 대예배

송출 PC가 Windows 8.1이고 OBS 27 및 obs-websocket v4를 사용하므로 `obs-compat.cjs`를 통해 OBS 제어 형식을 맞춘다. EXE는 다음 작업을 수행한다.

1. Windows 시작프로그램 등록
2. OBS 실행과 WebSocket 연결
3. Chrome 로그인 프로필 복사 및 원격 디버깅 실행
4. YouTube Studio 라이브 준비와 현재 영상 ID 확인
5. 원격 송출 시작·종료 명령 수신
6. OBS `StartStream`·`StopStream` 호출
7. 송출 상태와 heartbeat 보고

현재 원격 명령과 상태는 Firestore `liveStreamControls`, `liveStreamAgents`, `settings/main`으로 교환한다.

## 확인된 보안 문제

현재 EXE 소스와 설치 문서에는 Firebase 관리자 로그인 정보, OBS WebSocket 비밀번호, YouTube API 키가 고정값으로 포함돼 있다. 값 자체는 새 문서에 옮기지 않는다.

카페24 전환 시 다음을 수행한다.

- Firebase 관리자 로그인 정보를 EXE에서 완전히 제거한다.
- OBS 비밀번호는 송출 PC의 로컬 설정 파일로 이동한다.
- YouTube API 키는 카페24의 웹 루트 밖 서버 설정으로 이동하고 기존 키는 전환 후 교체한다.
- 설치 설명서에는 실제 비밀번호를 적지 않고 설정 위치와 입력 절차만 남긴다.

## 변경하지 않는 부분

- OBS 설치와 장면·프로필 구성
- OBS WebSocket v4 호환 처리
- `StartStream`, `StopStream`, `GetStreamStatus` 호출
- Chrome 프로필 기반 YouTube Studio 자동화
- YouTube 현재 영상 ID 확인과 동기화
- Windows 시작프로그램 등록
- EXE별 로그 파일과 오류 로그
- Node 16 Windows x64 빌드 대상

## 카페24 데이터 구조

### `live_stream_settings`

부서별 YouTube URL, 채널 ID, Chrome 프로필명, OBS 장면·프로필 설정, 현재 영상 ID, 공개 송출 여부를 저장한다. OBS 비밀번호와 기기 토큰은 저장하지 않는다.

### `live_stream_commands`

| 컬럼 | 용도 |
|---|---|
| `request_id` | 명령 고유값 |
| `stream_key` | 부서 키 |
| `desired_state` | `start` 또는 `stop` |
| `status` | `pending`, `processing`, `completed`, `error` |
| `requested_by` | 요청 관리자 |
| `requested_at` | 요청 일시 |
| `claimed_by` | 처리 에이전트 |
| `claimed_at` | 처리 시작 일시 |
| `processed_at` | 처리 완료 일시 |
| `message` | 결과 메시지 |

### `live_stream_agents`

| 컬럼 | 용도 |
|---|---|
| `agent_id` | 기기·EXE 식별자 |
| `token_hash` | 기기 토큰 해시 |
| `managed_keys_json` | 담당 부서 키 목록 |
| `agent_label` | PC 표시명 |
| `obs_connected` | OBS 연결 상태 |
| `stream_active` | 송출 상태 |
| `active_stream_key` | 현재 송출 부서 |
| `last_seen_at` | 마지막 heartbeat |
| `last_message` | 최근 상태 메시지 |
| `updated_at` | 수정 일시 |

## 에이전트 인증

관리자 계정 비밀번호를 EXE가 사용하지 않는다. 각 송출 PC에 서로 다른 충분히 긴 에이전트 토큰을 발급하고 DB에는 토큰 해시만 저장한다.

EXE 옆의 `live-agent.<부서키>.json`에 다음 값만 둔다.

- `apiBaseUrl`
- `agentId`
- `agentToken`
- `obsUrl`
- `obsPassword`
- `agentLabel`
- heartbeat·polling 간격
- 필요한 Chrome·YouTube 로컬 설정

설정 파일은 Git과 홈페이지 배포파일에 포함하지 않는다.

## 통신 방식

Firestore `onSnapshot` 대신 짧은 HTTPS polling을 사용한다. 교회 사이트 규모에서는 별도 WebSocket 서버가 필요하지 않다.

### EXE → 카페24

- `POST /api/live-agent.php?action=heartbeat`: OBS 연결·송출 상태 보고
- `POST /api/live-agent.php?action=poll`: 담당 부서 설정과 처리할 명령 조회
- `POST /api/live-agent.php?action=complete`: 명령 성공·실패 결과 기록
- `POST /api/live-agent.php?action=video`: 현재 YouTube 영상 ID 갱신
- `POST /api/live-agent.php?action=resolve-video`: 서버의 YouTube API 키로 현재 라이브 영상 ID 조회

모든 요청은 `Authorization: Bearer <agentToken>`을 사용한다. 서버는 토큰 해시와 담당 부서 키를 확인한다.

EXE는 서버의 `resolve-video`를 우선 사용하고, 기존 채널 페이지·YouTube 내부 응답 분석을 네트워크 오류 시 보조 경로로 유지한다. YouTube API 키는 EXE와 로컬 설정 파일에 넣지 않는다.

### 관리자·공개 화면

- 관리자는 PHP 세션으로 송출 시작·종료 명령을 생성한다.
- 관리자 라이브 화면은 약 2초 간격으로 명령과 에이전트 상태를 조회한다.
- 공개 라이브 화면은 약 5초 간격으로 공개 상태와 현재 영상 ID만 조회한다.
- 비밀번호, 토큰, 내부 오류 상세는 공개 API에 포함하지 않는다.

## 중복 명령 방지

에이전트가 `poll`할 때 서버가 트랜잭션으로 가장 오래된 `pending` 명령 하나를 `processing`으로 선점한다. 같은 `request_id`는 한 번만 처리하며 완료 응답도 멱등적으로 저장한다.

에이전트 재시작 시 오래된 `processing` 명령은 제한 시간 이후 다시 `pending`으로 돌리거나 오류 처리한다. 송출 상태를 OBS에서 다시 읽어 실제 상태와 DB를 맞춘다.

## EXE 소스 변경 방식

현재 실제 빌드는 부서별 `live-agent-*-pkg.cjs` 5개를 사용하며 코드가 상당 부분 중복돼 있다. OBS·Chrome·YouTube 로직을 한 번에 재작성하지 않는다.

공통 `live-agent-api-client.cjs`를 추가하여 인증, polling, heartbeat, 명령 완료만 한곳에서 처리한다. 각 EXE 소스에서는 Firebase import·로그인·문서 구독 부분만 이 공통 클라이언트 호출로 교체한다. 검증 후 중복 런타임 통합은 별도 작업으로 남긴다.

이 방식은 기존에 검증된 Windows 8.1·OBS 자동화 코드를 최대한 보존하면서 Firebase 통신만 교체한다.

## 배포와 전환

1. 카페24 라이브 API와 테이블을 배포한다.
2. 테스트용 에이전트 토큰을 발급한다.
3. 기존 EXE와 별도 이름으로 신규 EXE를 빌드한다.
4. OBS 없는 자동 테스트와 테스트 송출 PC의 실제 OBS 연결 테스트를 수행한다.
5. 부서별 송출 PC에 신규 EXE와 로컬 설정 파일을 설치한다.
6. 시작프로그램이 신규 EXE를 가리키는지 확인한다.
7. 관리자 송출 시작·종료와 공개 라이브 표시를 부서별로 확인한다.
8. 모든 PC 전환 후 Firebase 라이브 문서 사용을 제거한다.

기존 EXE는 롤백용으로 별도 폴더에 보관한다. 신규 EXE 문제가 발생하면 기존 EXE와 기존 홈페이지 배포본으로 즉시 되돌린다.

## 검증

- `obs-compat.test.cjs` 통과
- API 클라이언트의 인증·polling·재시도·멱등 처리 테스트
- 잘못된 토큰과 다른 부서 명령 접근 차단
- EXE 시작프로그램 등록
- OBS 미실행 시 자동 실행과 재연결
- OBS 시작·종료와 실제 상태 대조
- 동일 명령 중복 처리 방지
- 네트워크 단절 후 복구와 heartbeat 갱신
- Chrome 프로필·YouTube Studio 자동화 유지
- 현재 영상 ID 공개 페이지 반영
- 통합 송출 PC의 두 부서 키 처리
- Windows 8.1 송출 PC에서 신규 EXE 실행

## 제외 범위

- OBS 장면과 송출 품질 재설계
- YouTube 계정이나 채널 변경
- WebSocket 서버나 메시지 큐 도입
- 송출 PC 운영체제 업그레이드
- 기존 EXE 전체 런타임의 즉시 통합 리팩터링
