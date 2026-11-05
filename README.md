# 한끗차이 (THINK ARENA)

AI와 현실적인 대화 상황에서 대결하며, 스스로 생각하고 표현하는 능력을 키우는 개인 맞춤형 AI 사고력 게임.

## 실행 방법

```bash
npm install          # 처음 한 번
cp .env.example .env.local   # 틸론 API 정보 입력 (비워 두면 데모 모드)
npm run dev          # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm test` | 테스트 (Vitest) |
| `npm run lint` | 코드 규칙 검사 |
| `npm run build` | 배포용 빌드 |

## 폴더 구조

```
src/
├── app/                     화면(폴더 이름 = 주소)
│   ├── page.tsx             /            메인
│   ├── battle/              /battle      시나리오 선택, /battle/[id] 대결
│   ├── tini/                /tini        MY MINI-TTINI
│   ├── growth/              /growth      MY GROWTH
│   └── api/                 서버 API (AI 호출은 여기서만, 키는 서버에만 있음)
├── components/
│   ├── ui/                  shadcn/ui 컴포넌트 (자동 생성)
│   ├── battle/ tini/ growth/ layout/   기능별 화면 조각
├── data/scenarios.ts        기본 시나리오 8개
├── lib/
│   ├── game/engine.ts       게이지·턴·승패 규칙
│   ├── ai/client.ts         틸론(OpenAI 호환) 호출
│   ├── ai/prompts.ts        AI 지시문 — 말투·평가 기준 수정은 여기
│   ├── ai/service.ts        AI 실행 + 실패 시 데모 모드 대체
│   ├── ai/demo.ts           데모 모드(규칙 기반)
│   ├── growth.ts            성장 통계
│   └── storage.ts           브라우저 저장(localStorage)
└── types/index.ts           데이터 모양 정의
```

## AI 모드

- **🟢 틸론 GPU**: `.env.local`에 `TILON_API_BASE_URL`, `TILON_MODEL`(필요하면 `TILON_API_KEY`)을 넣으면 실제 모델을 호출해요.
- **🟡 데모 모드**: 설정이 없거나 호출에 실패하면 규칙 기반으로 대신 답해요. 화면에 항상 표시돼요.

자세한 기획은 [docs/PRD.md](docs/PRD.md)를 보세요.
