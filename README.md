# 사주운세 (saju-fortune-web)

생년월일시만 입력하면 사주팔자, 오행 분포, 운세 흐름, 궁합을 무료로 풀이해 주는 웹사이트입니다.

## 기능

- **내 사주 보기**: 사주팔자(연주·월주·일주·시주), 오행 분포, 일간(日干), 용신, 운세 풀이(종합운·연애운·재물운·직업운·건강운·한해 운세), 대운(大運)
- **궁합 보기**: 두 사람의 사주를 비교해 궁합 점수와 조율 포인트 제공

## 기술 스택

- 정적 사이트 (HTML / CSS / Vanilla JS)
- [`saju-fortune`](https://github.com/NomaDamas/k-skill) npm 패키지를 브라우저용으로 번들링 (esbuild)
- GitHub Pages로 배포

## 로컬 개발

```bash
npm install
npm run build   # dist/bundle.js 생성
```

`index.html`을 브라우저로 열거나 로컬 서버를 띄워 확인합니다.

```bash
npx serve .
```

## 면책 안내

사주 풀이는 전통 해석에 기반한 참고 자료이며, 의료·투자·법률·안전 결정을 대신하지 않습니다.

## 라이선스

- 이 프로젝트: MIT License
- `saju-fortune`: MIT License (© NomaDamas / k-skill)
