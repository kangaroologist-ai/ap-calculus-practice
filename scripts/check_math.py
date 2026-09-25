#!/usr/bin/env python3
"""Independent SymPy checks for the generated derivative corpus.

The TypeScript generator is deliberately not used as the oracle here.  This
script converts the stored MathJSON-like expressions to SymPy expressions and
checks each supported family with the appropriate calculus rule.  ``--limit``
means that many questions to check per family; the default checks the complete
registered-template, 100-seed corpus.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path
from typing import Any

import sympy as sp


ROOT = Path(__file__).resolve().parent
DEFAULT_CORPUS = ROOT.parent / "artifacts" / "math-corpus.json"
SUPPORTED_FAMILIES = {
    "constant",
    "power",
    "sum",
    "root",
    "exp",
    "log",
    "sin",
    "cos",
    "tan",
    "cot",
    "sec",
    "csc",
    "asin",
    "acos",
    "atan",
    "product",
    "quotient",
    "chain",
    "nested",
    "mixed",
    "implicit",
    "inverse",
    "higher",
    "parametric",
    "vector",
    "polar",
}
CHECKED_IDENTITIES: set[str] = set()
NUMERIC_FALLBACK_IDENTITIES = 0


class UnsupportedExpression(Exception):
    pass


def is_odd_root(q: dict[str, Any]) -> bool:
    """True for the odd-root (e.g. cube-root) template.

    Prefers the explicit `meta.oddRoot` flag a template registry entry
    carries; corpora produced before that metadata existed (generator
    <= 1.1.0) fall back to the old template-number convention, where
    template 1 was always the odd root.
    """

    meta = q.get("meta")
    if meta is not None and "oddRoot" in meta:
        return bool(meta["oddRoot"])
    return q["template"] == 1


def derivative_order(q: dict[str, Any], order_by_template: dict[int, int]) -> int:
    """The derivative order a `higher`/`parametric` question asks for.

    Prefers the explicit `meta.derivativeOrder`; falls back to the old
    template-number convention for corpora without `meta`.
    """

    meta = q.get("meta")
    if meta is not None and "derivativeOrder" in meta:
        return int(meta["derivativeOrder"])
    return order_by_template[q["template"]]


def rational_number(value: int | float) -> sp.Expr:
    if isinstance(value, bool):
        return sp.Integer(int(value))
    if isinstance(value, int):
        return sp.Integer(value)
    if not math.isfinite(value):
        raise ValueError(f"non-finite numeric literal: {value!r}")
    return sp.Rational(str(value))


def to_sympy(expr: Any, symbols: dict[str, sp.Symbol]) -> sp.Expr:
    if isinstance(expr, (int, float)):
        return rational_number(expr)
    if isinstance(expr, str):
        if expr in {"e", "ExponentialE"}:
            return sp.E
        if expr == "Pi":
            return sp.pi
        if expr not in symbols:
            symbols[expr] = sp.Symbol(expr, real=True)
        return symbols[expr]
    if not isinstance(expr, list) or not expr or not isinstance(expr[0], str):
        raise UnsupportedExpression(f"invalid expression node: {expr!r}")

    op = expr[0]
    args = [to_sympy(item, symbols) for item in expr[1:]]
    if op in {"Add", "Sum"}:
        return sp.Add(*args)
    if op in {"Multiply", "Product"}:
        return sp.Mul(*args)
    if op == "Negate":
        return -args[0]
    if op == "Subtract":
        return args[0] - args[1]
    if op == "Divide":
        return args[0] / args[1]
    if op == "Power":
        return args[0] ** args[1]
    if op == "Sqrt":
        return sp.sqrt(args[0])
    if op == "Exp":
        return sp.exp(args[0])
    if op == "Ln":
        return sp.log(args[0])
    if op == "Log":
        return sp.log(args[0]) if len(args) == 1 else sp.log(args[0], args[1])
    if op == "Sin":
        return sp.sin(args[0])
    if op == "Cos":
        return sp.cos(args[0])
    if op == "Tan":
        return sp.tan(args[0])
    if op == "Cot":
        return sp.cot(args[0])
    if op == "Sec":
        return sp.sec(args[0])
    if op == "Csc":
        return sp.csc(args[0])
    if op == "Arcsin":
        return sp.asin(args[0])
    if op == "Arccos":
        return sp.acos(args[0])
    if op == "Arctan":
        return sp.atan(args[0])
    if op == "Abs":
        return sp.Abs(args[0])
    raise UnsupportedExpression(f"unsupported operator {op!r}")


def simplify_difference(left: sp.Expr, right: sp.Expr) -> sp.Expr:
    """Use cheap rational normalization; avoid unbounded trig rewriting."""

    difference = left - right
    if difference == 0:
        return sp.Integer(0)
    try:
        cancelled = sp.cancel(sp.together(difference))
    except (TypeError, ValueError):
        cancelled = difference
    return cancelled


def equivalent(left: sp.Expr, right: sp.Expr) -> bool:
    try:
        return simplify_difference(left, right) == 0
    except (TypeError, ValueError, ZeroDivisionError):
        return False


def as_float(expr: sp.Expr, substitutions: dict[sp.Symbol, float]) -> float:
    value = complex(sp.N(expr.subs(substitutions), 30))
    if abs(value.imag) > 1e-8:
        raise ValueError(f"non-real value {value}")
    result = float(value.real)
    if not math.isfinite(result):
        raise ValueError(f"non-finite value {value}")
    return result


def close_numeric(left: sp.Expr, right: sp.Expr, substitutions: dict[sp.Symbol, float]) -> bool:
    try:
        a = as_float(left, substitutions)
        b = as_float(right, substitutions)
    except (TypeError, ValueError, ZeroDivisionError):
        return False
    return abs(a - b) <= 1e-9 + 1e-9 * max(abs(a), abs(b))


def interval_points(q: dict[str, Any]) -> list[float]:
    points: list[float] = []
    for lo, hi in q["domain"]["intervals"]:
        points.extend([lo + 0.37 * (hi - lo), lo + 0.63 * (hi - lo)])
    return points


def real_power(base: float, numerator: int, denominator: int) -> float:
    if denominator == 0:
        raise ValueError("zero denominator in rational exponent")
    if denominator < 0:
        numerator, denominator = -numerator, -denominator
    divisor = math.gcd(abs(numerator), denominator)
    numerator //= divisor
    denominator //= divisor
    if base < 0 and denominator % 2 == 0:
        raise ValueError("even root of a negative real")
    sign = -1.0 if base < 0 and abs(numerator) % 2 == 1 else 1.0
    return sign * abs(base) ** (numerator / denominator)


def real_root_expr_value(expr: Any, values: dict[str, float]) -> float:
    """Small real-domain evaluator for the odd-root regression case."""

    if isinstance(expr, (int, float)):
        return float(expr)
    if isinstance(expr, str):
        return values[expr]
    op = expr[0]
    args = expr[1:]
    if op == "Add":
        return sum(real_root_expr_value(item, values) for item in args)
    if op == "Multiply":
        result = 1.0
        for item in args:
            result *= real_root_expr_value(item, values)
        return result
    if op == "Negate":
        return -real_root_expr_value(args[0], values)
    if op == "Divide":
        return real_root_expr_value(args[0], values) / real_root_expr_value(args[1], values)
    if op == "Power":
        exponent = args[1]
        if not isinstance(exponent, list) or exponent[0] != "Divide":
            return real_root_expr_value(args[0], values) ** real_root_expr_value(exponent, values)
        numerator = int(real_root_expr_value(exponent[1], values))
        denominator = int(real_root_expr_value(exponent[2], values))
        return real_power(real_root_expr_value(args[0], values), numerator, denominator)
    raise UnsupportedExpression(f"unsupported real-root operator {op!r}")


def curve_points(q: dict[str, Any]) -> list[dict[str, float]]:
    curve = q["domain"].get("curve")
    if not curve:
        return []
    points: list[dict[str, float]] = []
    if curve["type"] == "circle":
        radius = float(curve["parameter"])
        for angle in [0.37, 0.63, 1.21, 2.17, 3.29]:
            points.append({"x": radius * math.cos(angle), "y": radius * math.sin(angle)})
    elif curve["type"] == "hyperbola":
        parameter = float(curve["parameter"])
        for lo, hi in q["domain"]["intervals"]:
            for x_value in [lo + 0.37 * (hi - lo), lo + 0.63 * (hi - lo)]:
                y_value = math.sqrt(x_value * x_value + parameter)
                points.extend([{"x": x_value, "y": y_value}, {"x": x_value, "y": -y_value}])
    elif curve["type"] == "graph":
        free = curve["free"]
        if free not in {"x", "y"}:
            raise UnsupportedExpression(f"unsupported graph free variable {free!r}")
        other = "y" if free == "x" else "x"
        free_symbol = sp.Symbol(free, real=True)
        for lo, hi in q["domain"]["intervals"]:
            for frac in (0.37, 0.63):
                free_value = lo + frac * (hi - lo)
                for branch in curve["branches"]:
                    expr = to_sympy(branch, {free: free_symbol})
                    try:
                        other_value = as_float(expr, {free_symbol: free_value})
                    except (TypeError, ValueError, ZeroDivisionError):
                        continue
                    points.append({free: free_value, other: other_value})
    else:
        raise UnsupportedExpression(f"unsupported curve {curve['type']!r}")
    return points


def assert_sample_equivalent(
    expected: sp.Expr,
    actual: sp.Expr,
    variable: sp.Symbol,
    q: dict[str, Any],
) -> None:
    if equivalent(expected, actual):
        return
    global NUMERIC_FALLBACK_IDENTITIES
    NUMERIC_FALLBACK_IDENTITIES += 1
    compared = 0
    for value in interval_points(q):
        # SymPy's ordinary rational powers use the principal complex branch.
        # The application deliberately supports real odd roots, so the
        # negative half of this one generated template is checked below with
        # a real-domain evaluator instead of a complex numerical substitution.
        if q["family"] == "root" and is_odd_root(q) and value < 0:
            continue
        if close_numeric(expected, actual, {variable: value}):
            compared += 1
            continue
        raise AssertionError(f"symbolic/numeric mismatch at {variable}={value}: expected {expected}, got {actual}")
    minimum = 2 if q["family"] == "root" and is_odd_root(q) else 3
    if compared < minimum:
        raise AssertionError(
            f"numeric fallback had only {compared} finite comparison points for expected {expected}, got {actual}"
        )


def check_direct(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    variable = symbols[q["domain"]["variable"]]
    source = to_sympy(q["source"][0], symbols)
    actual = to_sympy(q["answers"][0], symbols)
    expected = sp.diff(source, variable)
    assert_sample_equivalent(expected, actual, variable, q)
    if q["family"] == "root" and is_odd_root(q):
        source_node = q["source"][0]
        if not (isinstance(source_node, list) and source_node[0] == "Multiply"):
            raise AssertionError("unexpected odd-root source shape")
        power_node = source_node[-1]
        if not (isinstance(power_node, list) and power_node[0] == "Power"):
            raise AssertionError("unexpected odd-root power shape")
        exponent = power_node[2]
        if not (isinstance(exponent, list) and exponent[0] == "Divide"):
            raise AssertionError("odd-root exponent was not stored as a rational")
        numerator = int(exponent[1])
        denominator = int(exponent[2])
        coefficient = real_root_expr_value(source_node[1], {"x": -8.0})
        # Keep the power-rule factor explicit while avoiding any SymPy
        # principal-branch assumptions at x < 0.
        expected_real = coefficient * (numerator / denominator) * real_power(
            -8.0, numerator - denominator, denominator
        )
        actual_real = real_root_expr_value(q["answers"][0], {"x": -8.0})
        if not math.isclose(actual_real, expected_real, rel_tol=1e-10, abs_tol=1e-12):
            raise AssertionError(f"odd-root real branch mismatch at x=-8: expected {expected_real}, got {actual_real}")


def check_higher(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    variable = symbols[q["domain"]["variable"]]
    expected = to_sympy(q["source"][0], symbols)
    order = derivative_order(q, {0: 2, 1: 3})
    for _ in range(order):
        expected = sp.diff(expected, variable)
    actual = to_sympy(q["answers"][0], symbols)
    assert_sample_equivalent(expected, actual, variable, q)


def check_implicit(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    x = symbols["x"]
    y = symbols["y"]
    constraint = to_sympy(q["source"][0], symbols)
    actual = to_sympy(q["answers"][0], symbols)
    expected = -sp.diff(constraint, x) / sp.diff(constraint, y)
    checked = 0
    for point in curve_points(q):
        substitutions = {x: point["x"], y: point["y"]}
        if not close_numeric(constraint, sp.Integer(0), substitutions):
            raise AssertionError(f"curve sample is off constraint: {point}")
        if not close_numeric(expected, actual, substitutions):
            raise AssertionError(f"implicit mismatch on curve at {point}: expected {expected}, got {actual}")
        checked += 1
    if checked < 3:
        raise AssertionError("implicit formula did not produce enough finite curve samples")


def check_inverse(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    x = symbols["x"]
    source = to_sympy(q["source"][0], symbols)
    match = re.search(r"f\((-?[0-9]+(?:\.[0-9]+)?)\)=", q["prompt"])
    if not match:
        raise AssertionError(f"cannot recover inverse matching point from prompt: {q['prompt']}")
    point = sp.Rational(match.group(1))
    expected = 1 / sp.diff(source, x).subs(x, point)
    actual = to_sympy(q["answers"][0], symbols)
    if not close_numeric(expected, actual, {}):
        raise AssertionError(f"inverse derivative mismatch: expected {expected}, got {actual}")


def check_parametric(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    t = symbols["t"]
    x_expr = to_sympy(q["source"][0], symbols)
    y_expr = to_sympy(q["source"][1], symbols)
    expected = sp.diff(y_expr, t) / sp.diff(x_expr, t)
    if derivative_order(q, {0: 1, 1: 2}) == 2:
        expected = sp.diff(expected, t) / sp.diff(x_expr, t)
    actual = to_sympy(q["answers"][0], symbols)
    assert_sample_equivalent(expected, actual, t, q)


def check_vector(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    t = symbols["t"]
    expected = [sp.diff(to_sympy(expr, symbols), t) for expr in q["source"]]
    actual = [to_sympy(expr, symbols) for expr in q["answers"]]
    if len(expected) != len(actual):
        raise AssertionError(f"vector derivative length mismatch: expected {expected}, got {actual}")
    for expected_component, actual_component in zip(expected, actual):
        if equivalent(expected_component, actual_component):
            continue
        global NUMERIC_FALLBACK_IDENTITIES
        NUMERIC_FALLBACK_IDENTITIES += 1
        compared = 0
        for point in interval_points(q):
            if close_numeric(expected_component, actual_component, {t: point}):
                compared += 1
            else:
                raise AssertionError(f"vector derivative mismatch at t={point}: expected {expected_component}, got {actual_component}")
        if compared < 3:
            raise AssertionError(f"vector fallback had only {compared} comparison points")


def check_polar(q: dict[str, Any], symbols: dict[str, sp.Symbol]) -> None:
    theta = symbols["theta"]
    radius = to_sympy(q["source"][0], symbols)
    x_expr = radius * sp.cos(theta)
    y_expr = radius * sp.sin(theta)
    expected = sp.diff(y_expr, theta) / sp.diff(x_expr, theta)
    actual = to_sympy(q["answers"][0], symbols)
    assert_sample_equivalent(expected, actual, theta, q)


def check_domain_metadata(q: dict[str, Any]) -> None:
    family = q["family"]
    intervals = q["domain"]["intervals"]
    if family == "root":
        if not is_odd_root(q) and any(lo <= 0 or hi <= 0 for lo, hi in intervals):
            raise AssertionError(f"square-root comparison interval is not strictly positive: {intervals}")
        if is_odd_root(q):
            if any(lo <= 0 <= hi for lo, hi in intervals) or not any(hi < 0 for lo, hi in intervals) or not any(lo > 0 for lo, hi in intervals):
                raise AssertionError(f"odd-root comparison intervals must cover both signs without zero: {intervals}")
    if family == "log" and any(lo <= 0 or hi <= 0 for lo, hi in intervals):
        raise AssertionError(f"log comparison interval is not strictly positive: {intervals}")
    if family in {"asin", "acos", "atan"} and any(lo < -1 or hi > 1 for lo, hi in intervals):
        raise AssertionError(f"inverse-trig interval is outside the intended real sample range: {intervals}")
    if family in {"implicit"} and not q["domain"].get("curve"):
        raise AssertionError("implicit question has no curve metadata")
    if family in {"parametric", "polar"} and not q["domain"].get("guards"):
        raise AssertionError(f"{family} question has no denominator guard")


def check_question(q: dict[str, Any]) -> None:
    family = q["family"]
    role = q.get("role")
    if role is not None and role not in {"basic", "mix"}:
        raise AssertionError(f"unsupported template role {role!r}")
    if family not in SUPPORTED_FAMILIES:
        # This is deliberately non-blocking: a future catalog may add a family
        # before this independent oracle learns its rules.
        return
    if family in {"higher", "parametric"}:
        order = derivative_order(q, {0: 2, 1: 3} if family == "higher" else {0: 1, 1: 2})
        allowed = {2, 3} if family == "higher" else {1, 2}
        if order not in allowed:
            raise AssertionError(f"invalid {family} derivative order {order}")
    identity = json.dumps(
        {
            "family": family,
            "template": q["template"],
            "source": q["source"],
            "answers": q["answers"],
            "prompt": q["prompt"],
            "curve": q["domain"].get("curve"),
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    if identity not in CHECKED_IDENTITIES:
        symbols: dict[str, sp.Symbol] = {}
        variable = q["domain"]["variable"]
        symbols[variable] = sp.Symbol(variable, real=True)
        if family == "implicit":
            symbols.setdefault("x", sp.Symbol("x", real=True))
            symbols.setdefault("y", sp.Symbol("y", real=True))
            check_implicit(q, symbols)
        elif family == "inverse":
            check_inverse(q, symbols)
        elif family == "higher":
            check_higher(q, symbols)
        elif family == "parametric":
            check_parametric(q, symbols)
        elif family == "vector":
            check_vector(q, symbols)
        elif family == "polar":
            check_polar(q, symbols)
        else:
            check_direct(q, symbols)
        CHECKED_IDENTITIES.add(identity)
    check_domain_metadata(q)


def load_corpus(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        corpus = json.load(handle)
    if corpus.get("schemaVersion") != 1:
        raise AssertionError(f"unsupported corpus schema: {corpus.get('schemaVersion')!r}")
    template_counts = corpus.get("templateCounts")
    if not isinstance(template_counts, dict) or not template_counts or corpus.get("seedsPerTemplate") != 100:
        raise AssertionError("corpus is missing per-skill template counts or 100 seeds per template")
    if len(template_counts) != corpus.get("skillCount"):
        raise AssertionError("corpus templateCounts does not cover every skill")
    expected = sum(template_counts.values()) * corpus["seedsPerTemplate"]
    if corpus.get("questionCount") != expected or len(corpus.get("questions", [])) != expected:
        raise AssertionError("corpus question count is inconsistent with its header")
    return corpus


def selected_questions(questions: list[dict[str, Any]], limit: int | None) -> list[dict[str, Any]]:
    if limit is None:
        return questions
    by_family: dict[str, list[dict[str, Any]]] = {}
    for question in questions:
        by_family.setdefault(question["family"], []).append(question)
    return [question for family in by_family.values() for question in family[:limit]]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--limit", type=int, default=None, help="questions per family; omit for the full corpus")
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    try:
        corpus = load_corpus(args.corpus)
    except (OSError, json.JSONDecodeError, AssertionError) as error:
        print(f"CORPUS ERROR: {error}", file=sys.stderr)
        return 2

    questions = selected_questions(corpus["questions"], args.limit)
    failures: list[tuple[str, str]] = []
    unsupported = 0
    for index, question in enumerate(questions, start=1):
        try:
            if question["family"] not in SUPPORTED_FAMILIES:
                unsupported += 1
            check_question(question)
        except UnsupportedExpression as error:
            unsupported += 1
            if question["family"] in SUPPORTED_FAMILIES:
                failures.append((question["id"], f"unsupported expression in supported family: {error}"))
        except (AssertionError, TypeError, ValueError, ZeroDivisionError) as error:
            failures.append((question["id"], str(error)))
        if index % 250 == 0 and args.limit is None:
            print(f"checked {index}/{len(questions)}")

    checked = len(questions) - unsupported
    print(
        f"checked={checked} unsupported={unsupported} failures={len(failures)} "
        f"numericFallbackIdentities={NUMERIC_FALLBACK_IDENTITIES}"
    )
    if failures:
        for question_id, message in failures[:20]:
            print(f"FAIL {question_id}: {message}", file=sys.stderr)
        if len(failures) > 20:
            print(f"... and {len(failures) - 20} more failures", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
