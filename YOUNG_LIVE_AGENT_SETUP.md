# 청년부 라이브 에이전트 설치

1. `ShinaeLiveYoung.exe`와 `live-agent.young.json`을 같은 폴더에 둡니다.
2. `live-agent.example.json`을 복사해 `live-agent.young.json`으로 이름을 바꿉니다.
3. `managedStreamKeys`는 `["young"]`으로 설정합니다.
4. OBS Studio 27의 obs-websocket v4 포트는 `4444`를 사용합니다.
5. OBS 28 이상 기본 포트 `4455`로 바꾸지 않습니다.
6. 서버에서 발급한 에이전트 토큰과 방송 PC의 OBS 비밀번호는 로컬 JSON에만 입력합니다.
7. 관리자 화면에서 시작·종료, OBS 송출, 홈페이지 표시, 네트워크 재연결을 검증한 뒤 기존 EXE를 교체합니다.

자세한 공통 절차는 `LIVE_AGENT_SETUP.txt`를 따릅니다.
