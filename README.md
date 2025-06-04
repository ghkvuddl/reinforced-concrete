## 📌 Tips

- 데이터 입력화면에서 변수 명에 마우스 호버시 변수의 용도를 알려줍니다.

- 설계 로직만 빠르게 확인하고 싶을경우 src > logics 폴더에서 확인하세요.

- 등가 직사각형 응력 분포값 확인은 src > types > concrete.type.ts 파일에서 확인하세요.

## 🌐 Live Demo

아래 링크를 통해 배포사이트를 확인할 수 있습니다.

[http://reinforced-concrete.s3-website.ap-northeast-2.amazonaws.com/](http://reinforced-concrete.s3-website.ap-northeast-2.amazonaws.com/)

## 🗂️ Project Structure

- hooks > 페이지별 상태관리같이 좀 더 복잡한 구조나, 공통으로 사용되는 hook 관리하는 폴더

- logics > FE코드에 관심 없고 설계 로직만 확인하고 싶은분들을 위해 설계 로직만 따로 만들어 놓은 폴더

  > 보 (슬라브) 설계: beam.logic.ts

  > 기둥 (벽체) 설계: column.logic.ts

- pages > 라우팅 및 UI 그리는 폴더

  > 메인 페이지: src > pages > index.tsx

  > 빔 또는 슬라브 설계 페이지: src > pages > beam > index.tsx

- graphics > UI중에서도 특히 이해를 돕기위해 그림, 도형 등 시각적 자료를 그리는 폴더

- styles > 글로벌 스타일 적용 폴더

- types > 공통으로 사용되는 interface, enum, Map 등을 관리하는 폴더
