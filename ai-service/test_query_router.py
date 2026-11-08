
from app.rag.query_router import classify_query


TEST_CASES = [
    (
        "Tôi muốn tìm áo thun dưới 300 nghìn",
        "PRODUCT"
    ),
    (
        "Tư vấn sản phẩm mặc đi học",
        "PRODUCT"
    ),
    (
        "Áo đã giặt rồi có được đổi trả không?",
        "POLICY"
    ),
    (
        "Tôi có thể thanh toán bằng VietQR không?",
        "POLICY"
    ),
    (
        "Nếu giao hàng thất bại thì sao?",
        "POLICY"
    ),
    (
        "Tìm áo đi học và cho biết chính sách đổi size",
        "HYBRID"
    ),
    (
        "Tôi muốn mua áo và hỏi phí vận chuyển",
        "HYBRID"
    ),
]


def main():
    correct = 0

    for question, expected in TEST_CASES:
        result = classify_query(question).value

        passed = result == expected

        if passed:
            correct += 1

        print(f"\nQuestion: {question}")
        print(f"Expected: {expected}")
        print(f"Actual:   {result}")
        print(f"Result:   {'PASS' if passed else 'FAIL'}")

    print("\n" + "=" * 50)
    print(f"Passed: {correct}/{len(TEST_CASES)}")
    print("=" * 50)


if __name__ == "__main__":
    main()
