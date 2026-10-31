"""Kiểm nhanh bước tính bằng SymPy, gộp mọi phép kiểm vào một lần chạy.

  python kiem.py "<phép kiểm>" ["<phép kiểm>" …]

Mỗi phép kiểm một dạng:
- "A == B": A và B có bằng nhau không (đúng/sai), vd. "(x+1)^2 == x^2+2x+1";
- "giai: A = B, x": nghiệm của phương trình theo x (bỏ ", x" thì lấy các biến có mặt);
- "A": rút gọn A, kèm giá trị số nếu có.
Viết kiểu máy tính: ^ là lũy thừa, 2x là 2*x, sqrt(), sin(), pi.
"""
import sys

from sympy import N, Eq, simplify, solve, symbols
from sympy.parsing.sympy_parser import (convert_xor, implicit_multiplication_application, parse_expr,
                                        standard_transformations)

T = standard_transformations + (implicit_multiplication_application, convert_xor)


def p(s: str):
    return parse_expr(s.strip(), transformations=T)


def check(q: str) -> str:
    if q.startswith('giai:'):
        eq, _, var = q[5:].partition(',')
        lhs, _, rhs = eq.partition('=')
        e = Eq(p(lhs), p(rhs or '0'))
        return f'{q} → {solve(e, symbols(var.strip())) if var.strip() else solve(e)}'
    if '==' in q:
        a, b = q.split('==', 1)
        return f"{q} → {'đúng' if simplify(p(a) - p(b)) == 0 else 'sai'}"
    e = simplify(p(q))
    return f'{q} → {e}' + (f' ≈ {N(e, 6)}' if e.is_number else '')


def main() -> None:
    sys.stdout.reconfigure(encoding='utf-8')
    for q in sys.argv[1:]:
        try:
            print(check(q))
        except Exception as e:
            print(f'{q} → lỗi: {e}')


if __name__ == '__main__':
    main()
