# main.py

import os
from dotenv import load_dotenv
from openai import OpenAI

from models.label_classifier import LabelClassifier


def main():
    load_dotenv()

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    classifier = LabelClassifier(
        client=client,
        model_name="gpt-5.4-mini"
    )

    test_comments = [
        "좌좀 홍어들이 일베보다 더 극혐이다",
        "와 이거 완전 재앙이네. 깨끗한 나라 만든다면서 왜 이런 사건이 터지냐??",
        "몬생긴 여자인간들은 찌그러져있어라 확그냥 막그냥",
        "오면 화염병 던진다 돼지새키야",
        "수꼴틀딱시키들이 다 디져야 나라가 똑바로 될것같다..답이 없는 종자들ㅠ",
        "ㅇㅇ? 양놈이건 깜씨건 뭔 아방가르드하네",
        "OOO천지 개독교 새끼들아 다 착해져라!",
        "다들 오지랖 좀...되게 할 짓 없어보여요",
        "연기못하는 방구쟁이년",
        "뚱보끼린 뭔가 잘맞는게 있나보네",
    ]

    for comment in test_comments:
        result = classifier.predict(comment)
        print("=" * 50)
        print("댓글:", comment)
        print("분류:", result)


if __name__ == "__main__":
    main()