# tilon-ai — 교내 GPU(틸론)로 《별의 끝에서》 배경 이미지 생성

## 무엇을, 왜
- **활용 목적:** 게임 《별의 끝에서》의 지역 배경과 타이틀 이미지를 교내 GPU에서 이미지 생성 모델로 만들어 웹사이트에 반영
- **노트북:** [`starlight_image_generation.ipynb`](starlight_image_generation.ipynb)
- **모델 (GPU 메모리에 따라 자동 선택)**
  - 12GB 이상: `stabilityai/stable-diffusion-xl-base-1.0` (CreativeML Open RAIL++-M)
  - 12GB 미만: `stable-diffusion-v1-5/stable-diffusion-v1-5` (CreativeML Open RAIL-M)

## 실행 방법
1. 틸론(CUBE-INSTANCE)에 로그인 → Jupyter 실행
2. 이 노트북을 업로드하고 위에서부터 순서대로 실행
3. 생성된 `starlight_outputs.zip`을 내려받아 이 폴더(`tilon-ai/`)에 넣기
4. 압축을 풀면 `outputs/` 아래에 결과가 생기고, 웹용 이미지는 `public/generated/`로 복사해 사이트에 반영

## 결과물
| 파일 | 내용 |
|---|---|
| `outputs/gpu_env.json` | GPU 종류·메모리, Python, CUDA 확인 결과 |
| `outputs/generation_log.json` | 모델, 프롬프트, 시드, 장당 생성 시간, 최대 GPU 메모리, 실행 후 nvidia-smi |
| `outputs/web/*.webp` | 웹용 이미지 (1600×900) |

## 사이트 반영 위치
| 이미지 | 위치 |
|---|---|
| title | 게임 타이틀 화면, 홈 화면 ‘별의 끝에서’ 카드 |
| house / garden / plain / attic / hall | 게임 각 지역 배경 (별의 집 / 잊혀진 정원 / 그림자 평원 / 시간의 다락 / 별의 전당) |

등록 위치: `src/data/generated-images.ts`

## GPU 사용 기록
> 틸론에서 노트북을 실제로 실행한 뒤 기록합니다. (아직 실행 전)
