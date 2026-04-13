#label_classifier.py

import json
from openai import OpenAI


class LabelClassifier:
    def __init__(self, client: OpenAI, model_name: str):
        self.client = client
        self.model_name = model_name

    def predict(self, text: str) -> dict:
        prompt = f"""
너는 한국어 온라인 댓글의 독성 유형을 분류하는 멀티라벨 분류기다.

목표:
- 입력된 댓글이 어떤 독성 유형에 해당하는지 모두 판별하라.
- 하나의 댓글은 여러 라벨을 동시에 가질 수 있다.
- 해당하는 라벨이 없으면 빈 리스트를 반환하라.

라벨 정의:
- Profanity: 욕설, 비속어, 직접적인 모욕 표현
- Politics: 정치 성향 비하, 정치 관련 혐오/조롱 표현
- Origin: 출신, 지역, 국적에 대한 비하 표현
- Physical: 외모, 신체 특징에 대한 비하 표현
- Age: 나이, 세대에 대한 비하 표현
- Gender: 성별에 대한 비하, 고정관념, 차별 표현
- Religion: 종교에 대한 비하, 혐오, 조롱 표현
- Race: 인종, 피부색, 민족에 대한 차별/혐오 표현
- Sarcasm: 직접적인 욕설 없이 비꼬거나 조롱하며 상대를 깎아내리는 표현

판별 원칙:
- 반드시 댓글 내용에 근거해서만 판단하라.
- 하나의 댓글에 여러 유형이 동시에 포함될 수 있다.
- 일반적인 비판이나 아쉬움 표현은 라벨로 분류하지 마라.
- 애매할 경우 과도하게 라벨링하지 마라.

예시 1 (Origin)
댓글: "짱개들 지나간 곳은 폐허된다 ㅋㅋ"
출력:
{{"labels": ["Origin"]}}

예시 2 (Physical)
댓글: "밥맛없게생겼냐"
출력:
{{"labels": ["Physical"]}}

예시 3 (Politics)
댓글: "문재인 정권의 내로남불은 타의 추종을 불허하네."
출력:
{{"labels": ["Politics"]}}

예시 4 (Profanity)
댓글: "진짜 개멍청하네."
출력:
{{"labels": ["Profanity"]}}

예시 5 (Age)
댓글: "31살이 아이돌이래 미쳤나 기자"
출력:
{{"labels": ["Age"]}}

예시 6 (Gender)
댓글: "여자라서 저런가 수준이 좀 떨어지네."
출력:
{{"labels": ["Gender"]}}

예시 7 (Race)
댓글: "일본인이 우수하고 남조선인이 미개한건 사실 맞죠."
출력:
{{"labels": ["Race"]}}

예시 8 (Religion)
댓글: "개독교는 대한민국의 암적인 존재다"
출력:
{{"labels": ["Religion"]}}

예시 9 (Sarcasm)
댓글: "수준 진짜 처참하네 ㅋㅋ"
출력:
{{"labels": ["Sarcasm"]}}

예시 10 (multi label)
댓글: "여자라서 저런가 진짜 멍청하네."
출력:
{{"labels": ["Gender", "Profanity"]}}

이제 아래 댓글을 분류하라.

댓글:
"{text}"

반드시 JSON 형식으로만 답하라.
설명, 이유, 마크다운 코드블록은 절대 포함하지 마라.

출력 형식:
{{"labels": ["라벨1", "라벨2"]}}
"""
        response = self.client.responses.create(
            model=self.model_name,
            input=prompt
        )

        output_text = response.output_text.strip()
        result = json.loads(output_text)

        if "labels" not in result or not isinstance(result["labels"], list):
            raise ValueError("Invalid response format: 'labels' must be a list.")

        allowed_labels = {
            "Profanity",
            "Politics",
            "Origin",
            "Physical",
            "Age",
            "Gender",
            "Religion",
            "Race",
            "Sarcasm",
        }

        cleaned_labels = [
            label for label in result["labels"]
            if label in allowed_labels
        ]

        return {
            "labels": cleaned_labels
        }