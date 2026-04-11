# No-Fake Project

## Shared Server Deployment

관리자 페이지에서 만든 래플을 팀원 모두가 같은 데이터로 보려면, 각자 로컬 DB를 쓰지 말고 공용 서버에 백엔드와 DB를 같이 올려야 합니다.

이 프로젝트는 다음 구조로 배포하도록 정리되어 있습니다.

- `nofake-api`: Express + SQLite API 서버
- `nofake-web`: React 빌드 결과를 서빙하는 Nginx
- `nofake_sqlite` volume: 공용 SQLite 파일 영속 저장소

### 1. 서버에 프로젝트 업로드

공용으로 사용할 리눅스 서버(예: EC2, Lightsail, 사내 VM)에 이 레포를 올립니다.

### 2. 환경변수 파일 준비

루트에 `.env` 파일을 만들고 `.env.example`을 기준으로 값을 채웁니다.

중요한 값은 아래입니다.

- `RPC_URL`
- `CONTRACT_ADDRESS`
- `OWNER_PRIVATE_KEY`
- `REACT_APP_API_BASE_URL`
- `REACT_APP_BASE_URL`

예시:

```env
PORT=3001
DB_STORAGE_PATH=/data/database.sqlite
RPC_URL=https://your-rpc-url
CONTRACT_ADDRESS=0xYourContract
OWNER_PRIVATE_KEY=0xYourPrivateKey
REACT_APP_API_BASE_URL=https://your-domain.com
REACT_APP_BASE_URL=https://your-domain.com
```

### 3. Docker Compose로 실행

서버에 Docker와 Docker Compose가 설치되어 있다면 아래 명령으로 실행합니다.

```bash
docker compose up -d --build
```

### 4. 동작 방식

- 프론트는 `https://your-domain.com`으로 접속합니다.
- Nginx가 `/api/*` 요청을 내부 `nofake-api:3001`로 프록시합니다.
- SQLite 파일은 컨테이너 내부가 아니라 Docker volume `nofake_sqlite`에 저장됩니다.
- 그래서 컨테이너를 재시작해도 래플 데이터가 유지됩니다.

### 5. 팀원들이 접속하는 방법

팀원들은 더 이상 각자 로컬 백엔드를 띄울 필요가 없습니다.

- 같은 공용 URL로 접속
- 같은 공용 API 호출
- 같은 공용 SQLite 데이터 사용

즉, 관리자 PC에서 만든 래플이 다른 팀원 PC 사용자 화면에서도 동일하게 보입니다.

### 6. 주의사항

- 지금은 DB를 SQLite로 유지한 실무형 "단일 공용 서버" 구조입니다.
- 트래픽이 커지면 SQLite 대신 Postgres/MySQL로 옮기는 것이 더 좋습니다.
- Docker volume은 백업 대상에 포함하는 것을 권장합니다.
