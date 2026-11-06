# tilon-ai — 교내 GPU(틸론)로 《별의 끝에서》 배경 이미지 생성

## 무엇을, 왜
- **활용 목적:** 게임 《별의 끝에서》의 지역 배경과 타이틀 이미지를 교내 GPU에서 이미지 생성 모델로 만들어 웹사이트에 반영
- **노트북:** [`starlight_image_generation.ipynb`](starlight_image_generation.ipynb)
- **모델:** `stabilityai/sdxl-turbo` (해커톤 실습 노트북과 같은 서버 배포본 `/opt/models/sdxl-turbo`, 896×512, 4 steps, guidance 0)
  - 라이선스: Stability AI Non-Commercial Research Community License (비상업 해커톤 시연 용도)

## 실행 방법
1. 틸론(CUBE-INSTANCE)에 로그인 → Jupyter 실행
2. 해커톤 실습 노트북(workshop.ipynb)의 0-1, 3-1 셀을 실행한 뒤, 이 노트북의 마지막 셀을 새 셀에 붙여 넣어 실행 (또는 이 노트북 전체를 순서대로 실행)
3. 생성된 `starlight_outputs.zip`을 내려받아 이 폴더(`tilon-ai/`)에 넣기
4. 압축을 풀면 `outputs/` 아래에 결과가 생기고, 웹용 이미지는 `public/generated/`로 복사해 사이트에 반영

## 결과물
| 파일 | 내용 |
|---|---|
| `outputs/generation_log.json` | 모델·경로, GPU 이름·메모리, CUDA·torch 버전, 프롬프트, 시드, 장당 생성 시간, 최대 GPU 메모리, nvidia-smi |
| `outputs/web/*.webp` | 웹용 이미지 (1600×900) |
| `outputs/*.png` | 원본 (896×512, 저장소에는 올리지 않음) |

## 사이트 반영 위치
| 이미지 | 위치 |
|---|---|
| title | 게임 타이틀 화면, 홈 화면 ‘별의 끝에서’ 카드 |
| house / garden / plain / attic / hall | 게임 각 지역 배경 (별의 집 / 잊혀진 정원 / 그림자 평원 / 시간의 다락 / 별의 전당) |

등록 위치: `src/data/generated-images.ts`

## GPU 사용 기록
> 틸론에서 노트북을 실제로 실행한 뒤 기록합니다. (아직 실행 전)
