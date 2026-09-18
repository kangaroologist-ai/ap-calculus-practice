# Derivative Studio: Skill Examples

Two real generated examples for every differentiation skill in `src/catalog.ts`.
The student-facing prompts are in English; each skill has a Chinese type note for teacher review.

Generated from `generateQuestion` version `1.1.0` on 2026-09-19; 26 skills × 2 templates = 52 questions.

> The answers preserve the production generator's expression tree, so an unsimplified form may appear. Equivalent expressions are accepted by the app's grader.

## Coverage and verification

Every question below was generated with a fixed seed and an explicit template override (`0` and `1`). The verification pass checked the catalog skill ID, level, template, generator version, source/answer presence, and the answer tree recomputed from the production derivative rules. Inverse-function answers were additionally checked numerically as the reciprocal of the original derivative at the matching input.

| Skill ID | Level | Templates | Verification |
| --- | ---: | --- | --- |
| `constant` | 1 | 0 and 1 | verified |
| `power` | 1 | 0 and 1 | verified |
| `sum` | 1 | 0 and 1 | verified |
| `root` | 1 | 0 and 1 | verified |
| `exp` | 2 | 0 and 1 | verified |
| `log` | 2 | 0 and 1 | verified |
| `sin` | 2 | 0 and 1 | verified |
| `cos` | 2 | 0 and 1 | verified |
| `tan` | 2 | 0 and 1 | verified |
| `cot` | 2 | 0 and 1 | verified |
| `sec` | 2 | 0 and 1 | verified |
| `csc` | 2 | 0 and 1 | verified |
| `asin` | 2 | 0 and 1 | verified |
| `acos` | 2 | 0 and 1 | verified |
| `atan` | 2 | 0 and 1 | verified |
| `product` | 3 | 0 and 1 | verified |
| `quotient` | 3 | 0 and 1 | verified |
| `chain` | 3 | 0 and 1 | verified |
| `nested` | 4 | 0 and 1 | verified |
| `mixed` | 4 | 0 and 1 | verified |
| `implicit` | 5 | 0 and 1 | verified |
| `inverse` | 5 | 0 and 1 | verified |
| `higher` | 5 | 0 and 1 | verified |
| `parametric` | 6 | 0 and 1 | verified |
| `vector` | 6 | 0 and 1 | verified |
| `polar` | 6 | 0 and 1 | verified |

## Examples

### constant — Constants

**题型说明（中文）:** 常数函数：常数没有变化，导数为零。

**English focus:** Differentiate a constant.

**Rule / definition:** The derivative of a constant is zero.

#### 1. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=0
\]

**Production metadata.**

- Generator ID: `constant:0:skill-examples-2026-09-19:constant:template-0`
- Seed: `skill-examples-2026-09-19:constant:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 2. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7+\frac{8}{4}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=0
\]

**Production metadata.**

- Generator ID: `constant:1:skill-examples-2026-09-19:constant:template-1`
- Seed: `skill-examples-2026-09-19:constant:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### power — Power rule

**题型说明（中文）:** 幂函数：把指数乘到前面，再把指数减一。

**English focus:** Apply the power rule.

**Rule / definition:** Multiply by the exponent, then subtract one from the exponent.

#### 3. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{4}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot x^{3}
\]

**Production metadata.**

- Generator ID: `power:0:skill-examples-2026-09-19:power:template-0`
- Seed: `skill-examples-2026-09-19:power:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 4. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=2\cdot x^{-5}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot \left(-5\right)\cdot x^{-6}
\]

**Production metadata.**

- Generator ID: `power:1:skill-examples-2026-09-19:power:template-1`
- Seed: `skill-examples-2026-09-19:power:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### sum — Sums & constant multiples

**题型说明（中文）:** 和与常数倍：逐项求导，保留每一项的常数系数。

**English focus:** Differentiate a sum and constant multiples term by term.

**Rule / definition:** Differentiate each term separately and keep constant coefficients.

#### 5. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{2}+4\cdot x^{2}+3
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot x+4\cdot 2\cdot x
\]

**Production metadata.**

- Generator ID: `sum:0:skill-examples-2026-09-19:sum:template-0`
- Seed: `skill-examples-2026-09-19:sum:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 6. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=4\cdot x^{3}+\left(-7\right)\cdot x+3
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot 3\cdot x^{2}-7
\]

**Production metadata.**

- Generator ID: `sum:1:skill-examples-2026-09-19:sum:template-1`
- Seed: `skill-examples-2026-09-19:sum:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### root — Roots & fractional powers

**题型说明（中文）:** 根式与分数幂：先改写为分数指数，再使用幂法则。

**English focus:** Rewrite a root as a fractional power and differentiate.

**Rule / definition:** Rewrite a root as a fractional power, then apply the power rule.

#### 7. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5\cdot x^{\frac{1}{2}}
\]

**Definition / validity conditions.** For the square-root template, use x > 0 for the derivative (the function itself is real for x ≥ 0).

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \frac{1}{2}\cdot x^{\frac{-1}{2}}
\]

**Production metadata.**

- Generator ID: `root:0:skill-examples-2026-09-19:root:template-0`
- Seed: `skill-examples-2026-09-19:root:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.1, 1], [1, 5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 8. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7\cdot x^{\frac{1}{3}}
\]

**Definition / validity conditions.** For the cube-root template, the real function is defined for every x, but its derivative is undefined at x = 0. Thus x ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=7\cdot \frac{1}{3}\cdot x^{\frac{-2}{3}}
\]

**Production metadata.**

- Generator ID: `root:1:skill-examples-2026-09-19:root:template-1`
- Seed: `skill-examples-2026-09-19:root:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-5, -0.1], [0.1, 5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### exp — Exponential functions

**题型说明（中文）:** 指数函数：外层指数函数乘以内层导数；其他底数还要乘以 ln(底数)。

**English focus:** Differentiate an exponential function, including its inner derivative.

**Rule / definition:** For e to a function, multiply by the inner derivative; for another base, also multiply by its natural logarithm.

#### 9. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{3\cdot x+9}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=e^{3\cdot x+9}\cdot 3
\]

**Production metadata.**

- Generator ID: `exp:0:skill-examples-2026-09-19:exp:template-0`
- Seed: `skill-examples-2026-09-19:exp:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 10. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5^{x}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5^{x}\cdot \ln\left(5\right)
\]

**Production metadata.**

- Generator ID: `exp:1:skill-examples-2026-09-19:exp:template-1`
- Seed: `skill-examples-2026-09-19:exp:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### log — Logarithmic functions

**题型说明（中文）:** 对数函数：ln(u) 的导数为 u′/u；换底后分母出现 ln(底数)。

**English focus:** Differentiate a logarithmic function on its real domain.

**Rule / definition:** The derivative of ln(u) is u′/u; a different base adds a logarithm in the denominator.

#### 11. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\ln\left(8\cdot x+2\right)
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{8}{8\cdot x+2}
\]

**Production metadata.**

- Generator ID: `log:0:skill-examples-2026-09-19:log:template-0`
- Seed: `skill-examples-2026-09-19:log:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.1, 1], [1, 5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 12. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\ln\left(x\right)}{\ln\left(9\right)}
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\frac{1}{x}\cdot \ln\left(9\right)}{\left(\ln\left(9\right)\right)^{2}}
\]

**Production metadata.**

- Generator ID: `log:1:skill-examples-2026-09-19:log:template-1`
- Seed: `skill-examples-2026-09-19:log:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.1, 1], [1, 5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### sin — sin derivatives

**题型说明（中文）:** 正弦函数：使用 sin(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a sine function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 13. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=4\cdot \sin\left(x\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot \cos\left(x\right)
\]

**Production metadata.**

- Generator ID: `sin:0:skill-examples-2026-09-19:sin:template-0`
- Seed: `skill-examples-2026-09-19:sin:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 14. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\sin\left(8\cdot x+4\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\cos\left(8\cdot x+4\right)\cdot 8
\]

**Production metadata.**

- Generator ID: `sin:1:skill-examples-2026-09-19:sin:template-1`
- Seed: `skill-examples-2026-09-19:sin:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### cos — cos derivatives

**题型说明（中文）:** 余弦函数：使用 −sin(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cosine function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 15. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=9\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=9\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `cos:0:skill-examples-2026-09-19:cos:template-0`
- Seed: `skill-examples-2026-09-19:cos:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 16. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\cos\left(8\cdot x+9\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\sin\left(8\cdot x+9\right)\cdot 8\right)
\]

**Production metadata.**

- Generator ID: `cos:1:skill-examples-2026-09-19:cos:template-1`
- Seed: `skill-examples-2026-09-19:cos:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### tan — tan derivatives

**题型说明（中文）:** 正切函数：使用 sec²(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a tangent function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 17. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \tan\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \left(\sec\left(x\right)\right)^{2}
\]

**Production metadata.**

- Generator ID: `tan:0:skill-examples-2026-09-19:tan:template-0`
- Seed: `skill-examples-2026-09-19:tan:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 18. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\tan\left(4\cdot x+5\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\left(\sec\left(4\cdot x+5\right)\right)^{2}\cdot 4
\]

**Production metadata.**

- Generator ID: `tan:1:skill-examples-2026-09-19:tan:template-1`
- Seed: `skill-examples-2026-09-19:tan:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### cot — cot derivatives

**题型说明（中文）:** 余切函数：使用 −csc²(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cotangent function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 19. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=6\cdot \cot\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=6\cdot \left(-\left(\left(\csc\left(x\right)\right)^{2}\right)\right)
\]

**Production metadata.**

- Generator ID: `cot:0:skill-examples-2026-09-19:cot:template-0`
- Seed: `skill-examples-2026-09-19:cot:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 20. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\cot\left(9\cdot x+7\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\left(\csc\left(9\cdot x+7\right)\right)^{2}\cdot 9\right)
\]

**Production metadata.**

- Generator ID: `cot:1:skill-examples-2026-09-19:cot:template-1`
- Seed: `skill-examples-2026-09-19:cot:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### sec — sec derivatives

**题型说明（中文）:** 正割函数：使用 sec(u)tan(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a secant function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 21. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7\cdot \sec\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=7\cdot \sec\left(x\right)\cdot \tan\left(x\right)
\]

**Production metadata.**

- Generator ID: `sec:0:skill-examples-2026-09-19:sec:template-0`
- Seed: `skill-examples-2026-09-19:sec:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 22. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\sec\left(6\cdot x+3\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\sec\left(6\cdot x+3\right)\cdot \tan\left(6\cdot x+3\right)\cdot 6
\]

**Production metadata.**

- Generator ID: `sec:1:skill-examples-2026-09-19:sec:template-1`
- Seed: `skill-examples-2026-09-19:sec:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### csc — csc derivatives

**题型说明（中文）:** 余割函数：使用 −csc(u)cot(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cosecant function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### 23. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=3\cdot \csc\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot \left(-\left(\csc\left(x\right)\cdot \cot\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `csc:0:skill-examples-2026-09-19:csc:template-0`
- Seed: `skill-examples-2026-09-19:csc:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 24. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\csc\left(8\cdot x+6\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\csc\left(8\cdot x+6\right)\cdot \cot\left(8\cdot x+6\right)\cdot 8\right)
\]

**Production metadata.**

- Generator ID: `csc:1:skill-examples-2026-09-19:csc:template-1`
- Seed: `skill-examples-2026-09-19:csc:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### asin — arcsin derivatives

**题型说明（中文）:** 反正弦函数：使用 1/√(1−u²)，并满足实数定义域。

**English focus:** Differentiate an inverse-sine function on the interior of its real domain.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### 25. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=2\cdot \arcsin\left(x\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot \frac{1}{\sqrt{1-\left(x^{2}\right)}}
\]

**Production metadata.**

- Generator ID: `asin:0:skill-examples-2026-09-19:asin:template-0`
- Seed: `skill-examples-2026-09-19:asin:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 26. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arcsin\left(\frac{x}{6}\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\frac{6}{6^{2}}}{\sqrt{1-\left(\left(\frac{x}{6}\right)^{2}\right)}}
\]

**Production metadata.**

- Generator ID: `asin:1:skill-examples-2026-09-19:asin:template-1`
- Seed: `skill-examples-2026-09-19:asin:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### acos — arccos derivatives

**题型说明（中文）:** 反余弦函数：使用 −1/√(1−u²)，并满足实数定义域。

**English focus:** Differentiate an inverse-cosine function on the interior of its real domain.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### 27. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7\cdot \arccos\left(x\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=7\cdot \left(-\left(\frac{1}{\sqrt{1-\left(x^{2}\right)}}\right)\right)
\]

**Production metadata.**

- Generator ID: `acos:0:skill-examples-2026-09-19:acos:template-0`
- Seed: `skill-examples-2026-09-19:acos:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 28. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arccos\left(\frac{x}{5}\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\frac{\frac{5}{5^{2}}}{\sqrt{1-\left(\left(\frac{x}{5}\right)^{2}\right)}}\right)
\]

**Production metadata.**

- Generator ID: `acos:1:skill-examples-2026-09-19:acos:template-1`
- Seed: `skill-examples-2026-09-19:acos:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### atan — arctan derivatives

**题型说明（中文）:** 反正切函数：使用 1/(1+u²)，定义域为全体实数。

**English focus:** Differentiate an inverse-tangent function.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### 29. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=4\cdot \arctan\left(x\right)
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot \frac{1}{1+x^{2}}
\]

**Production metadata.**

- Generator ID: `atan:0:skill-examples-2026-09-19:atan:template-0`
- Seed: `skill-examples-2026-09-19:atan:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 30. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arctan\left(\frac{x}{7}\right)
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\frac{7}{7^{2}}}{1+\left(\frac{x}{7}\right)^{2}}
\]

**Production metadata.**

- Generator ID: `atan:1:skill-examples-2026-09-19:atan:template-1`
- Seed: `skill-examples-2026-09-19:atan:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.8, -0.05], [0.05, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### product — Product rule

**题型说明（中文）:** 乘积法则：第一因子的导数乘第二因子，加第一因子乘第二因子的导数。

**English focus:** Apply the product rule.

**Rule / definition:** Differentiate the first factor times the second, plus the first times the derivative of the second.

#### 31. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{3}\cdot e^{x}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot x^{2}\cdot e^{x}+x^{3}\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `product:0:skill-examples-2026-09-19:product:template-0`
- Seed: `skill-examples-2026-09-19:product:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 32. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(x^{2}+7\right)\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot x\cdot \cos\left(x\right)+\left(x^{2}+7\right)\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `product:1:skill-examples-2026-09-19:product:template-1`
- Seed: `skill-examples-2026-09-19:product:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### quotient — Quotient rule

**题型说明（中文）:** 商法则：分子为 u′v−uv′，分母为 v²，保持顺序。

**English focus:** Apply the quotient rule.

**Rule / definition:** Use (u′v − uv′)/v². Keep the order in the numerator.

#### 33. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{x^{2}+3}{7\cdot x+3}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{2\cdot x\cdot \left(7\cdot x+3\right)-\left(\left(x^{2}+3\right)\cdot 7\right)}{\left(7\cdot x+3\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:0:skill-examples-2026-09-19:quotient:template-0`
- Seed: `skill-examples-2026-09-19:quotient:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 34. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{e^{x}}{x^{2}+3}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{e^{x}\cdot \left(x^{2}+3\right)-\left(e^{x}\cdot 2\cdot x\right)}{\left(x^{2}+3\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:1:skill-examples-2026-09-19:quotient:template-1`
- Seed: `skill-examples-2026-09-19:quotient:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### chain — Chain rule

**题型说明（中文）:** 链式法则：先求外层函数在内层处的导数，再乘以内层导数。

**English focus:** Apply a single chain rule.

**Rule / definition:** Differentiate the outer function at the inner function, then multiply by the inner derivative.

#### 35. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(2\cdot x+9\right)^{2}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot \left(2\cdot x+9\right)\cdot 2
\]

**Production metadata.**

- Generator ID: `chain:0:skill-examples-2026-09-19:chain:template-0`
- Seed: `skill-examples-2026-09-19:chain:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 36. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{x^{3}+4}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=e^{x^{3}+4}\cdot 3\cdot x^{2}
\]

**Production metadata.**

- Generator ID: `chain:1:skill-examples-2026-09-19:chain:template-1`
- Seed: `skill-examples-2026-09-19:chain:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### nested — Nested chain rule

**题型说明（中文）:** 多层链式法则：由外向内逐层求导，并乘上每一层的导数。

**English focus:** Apply the chain rule through multiple layers.

**Rule / definition:** Work from the outside in, multiplying by the derivative of every inner layer.

#### 37. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\sin\left(\sin\left(2\cdot x+9\right)\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\cos\left(\sin\left(2\cdot x+9\right)\right)\cdot \cos\left(2\cdot x+9\right)\cdot 2
\]

**Production metadata.**

- Generator ID: `nested:0:skill-examples-2026-09-19:nested:template-0`
- Seed: `skill-examples-2026-09-19:nested:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 38. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{\left(5\cdot x+2\right)^{2}}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=e^{\left(5\cdot x+2\right)^{2}}\cdot 2\cdot \left(5\cdot x+2\right)\cdot 5
\]

**Production metadata.**

- Generator ID: `nested:1:skill-examples-2026-09-19:nested:template-1`
- Seed: `skill-examples-2026-09-19:nested:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### mixed — Mixed differentiation

**题型说明（中文）:** 混合求导：先识别最外层运算，再在各因子内部使用相应法则。

**English focus:** Combine product, quotient, and chain rules.

**Rule / definition:** Identify the outermost operation first, then apply the rules within each factor.

#### 39. Template 0

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(x^{2}+3\right)\cdot e^{5\cdot x}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot x\cdot e^{5\cdot x}+\left(x^{2}+3\right)\cdot e^{5\cdot x}\cdot 5
\]

**Production metadata.**

- Generator ID: `mixed:0:skill-examples-2026-09-19:mixed:template-0`
- Seed: `skill-examples-2026-09-19:mixed:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 40. Template 1

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{e^{2\cdot x+4}}{x^{2}+4}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{e^{2\cdot x+4}\cdot 2\cdot \left(x^{2}+4\right)-\left(e^{2\cdot x+4}\cdot 2\cdot x\right)}{\left(x^{2}+4\right)^{2}}
\]

**Production metadata.**

- Generator ID: `mixed:1:skill-examples-2026-09-19:mixed:template-1`
- Seed: `skill-examples-2026-09-19:mixed:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### implicit — Implicit differentiation

**题型说明（中文）:** 隐函数求导：对 F(x,y)=0 关于 x 求导；每个 y 的导数都带 dy/dx。

**English focus:** Differentiate an equation that relates x and y.

**Rule / definition:** Differentiate F(x,y)=0 with respect to x; every derivative of y introduces dy/dx.

#### 41. Template 0

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
x^{2}+y^{2}-49=0
\]

**Definition / validity conditions.** Stay on the displayed curve and use the generator condition y ≠ 0, so the implicit derivative can be isolated.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
dy/dx=-\left(\frac{2\cdot x}{2\cdot y}\right)
\]

**Production metadata.**

- Generator ID: `implicit:0:skill-examples-2026-09-19:implicit:template-0`
- Seed: `skill-examples-2026-09-19:implicit:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve, where y ≠ 0.
- Validation intervals sampled by the app: [0.25, 2.8], [3.4, 6]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 42. Template 1

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
y^{2}-\left(x^{2}\right)-9=0
\]

**Definition / validity conditions.** Stay on the displayed curve and use the generator condition y ≠ 0, so the implicit derivative can be isolated.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
dy/dx=-\left(\frac{-\left(2\cdot x\right)}{2\cdot y}\right)
\]

**Production metadata.**

- Generator ID: `implicit:1:skill-examples-2026-09-19:implicit:template-1`
- Seed: `skill-examples-2026-09-19:implicit:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve, where y ≠ 0.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### inverse — Inverse-function derivatives

**题型说明（中文）:** 反函数导数：在对应点使用 (f⁻¹)′(a)=1/f′(b)。

**English focus:** Use the reciprocal derivative theorem for an inverse function.

**Rule / definition:** Use (f⁻¹)′(a)=1/f′(b), where f(b)=a and f′(b) is nonzero.

#### 43. Template 0

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=9\cdot x+6,\quad f(6)=60.\quad (f^{-1})'(60)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(60)=\frac{1}{9}
\]

**Production metadata.**

- Generator ID: `inverse:0:skill-examples-2026-09-19:inverse:template-0`
- Seed: `skill-examples-2026-09-19:inverse:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 44. Template 1

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=x^{3}+8\cdot x,\quad f(3)=51.\quad (f^{-1})'(51)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(51)=\frac{1}{35}
\]

**Production metadata.**

- Generator ID: `inverse:1:skill-examples-2026-09-19:inverse:template-1`
- Seed: `skill-examples-2026-09-19:inverse:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### higher — Higher derivatives

**题型说明（中文）:** 高阶导数：连续求导，并准确区分所要求的阶数。

**English focus:** Find a second or third derivative.

**Rule / definition:** Differentiate successively; keep track of which derivative is requested.

#### 45. Template 0

**Student question (English).** For the function shown below, find the second derivative.

\[
f(x)=x^{5}+4\cdot x^{2}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f''(x)=5\cdot 4\cdot x^{3}+4\cdot 2
\]

**Production metadata.**

- Generator ID: `higher:0:skill-examples-2026-09-19:higher:template-0`
- Seed: `skill-examples-2026-09-19:higher:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 46. Template 1

**Student question (English).** For the function shown below, find the third derivative.

\[
f(x)=6\cdot \sin\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'''(x)=6\cdot \left(-\left(\cos\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `higher:1:skill-examples-2026-09-19:higher:template-1`
- Seed: `skill-examples-2026-09-19:higher:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### parametric — Parametric derivatives

**题型说明（中文）:** 参数方程导数：用 (dy/dt)/(dx/dt)；二阶导数还要再次除以 dx/dt。

**English focus:** Find a first or second derivative from parametric equations.

**Rule / definition:** Use dy/dx=(dy/dt)/(dx/dt). For the second derivative, differentiate the slope in t and divide by dx/dt again.

#### 47. Template 0

**Student question (English).** For the parametric equations below, find dy/dx in terms of t.

\[
x(t)=6\cdot t+7,\quad y(t)=\sin\left(t\right)
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
dy/dx=\frac{\cos\left(t\right)}{6}
\]

**Production metadata.**

- Generator ID: `parametric:0:skill-examples-2026-09-19:parametric:template-0`
- Seed: `skill-examples-2026-09-19:parametric:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: \frac{dx}{dt}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 48. Template 1

**Student question (English).** For the parametric equations below, find d²y/dx² in terms of t.

\[
x(t)=t^{2},\quad y(t)=t^{3}
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
d²y/dx²=\frac{\frac{3\cdot 2\cdot t\cdot 2\cdot t-\left(3\cdot t^{2}\cdot 2\right)}{\left(2\cdot t\right)^{2}}}{2\cdot t}
\]

**Production metadata.**

- Generator ID: `parametric:1:skill-examples-2026-09-19:parametric:template-1`
- Seed: `skill-examples-2026-09-19:parametric:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: \frac{dx}{dt}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### vector — Vector derivatives

**题型说明（中文）:** 向量函数导数：分别对每个分量关于参数求导。

**English focus:** Differentiate every component of a vector-valued function.

**Rule / definition:** Differentiate each component with respect to the parameter.

#### 49. Template 0

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle t^{2},\sin\left(3\cdot t\right)\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle 2\cdot t,\; \cos\left(3\cdot t\right)\cdot 3 \rangle
\]

**Production metadata.**

- Generator ID: `vector:0:skill-examples-2026-09-19:vector:template-0`
- Seed: `skill-examples-2026-09-19:vector:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 50. Template 1

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle e^{5\cdot t},\cos\left(t\right)\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle e^{5\cdot t}\cdot 5,\; -\left(\sin\left(t\right)\right) \rangle
\]

**Production metadata.**

- Generator ID: `vector:1:skill-examples-2026-09-19:vector:template-1`
- Seed: `skill-examples-2026-09-19:vector:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### polar — Polar slopes

**题型说明（中文）:** 极坐标斜率：写成 x=r cosθ、y=r sinθ，再用 (dy/dθ)/(dx/dθ)。

**English focus:** Find the slope of a polar curve.

**Rule / definition:** Write x=r cos(θ), y=r sin(θ), then use (dy/dθ)/(dx/dθ).

#### 51. Template 0

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=7\cdot \sin\left(\theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
dy/dx=\frac{7\cdot \cos\left(\theta\right)\cdot \sin\left(\theta\right)+7\cdot \sin\left(\theta\right)\cdot \cos\left(\theta\right)}{7\cdot \cos\left(\theta\right)\cdot \cos\left(\theta\right)+7\cdot \sin\left(\theta\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:0:skill-examples-2026-09-19:polar:template-0`
- Seed: `skill-examples-2026-09-19:polar:template-0`
- Template: 0 (the generator's first structure)
- Generator version: `1.1.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: \frac{dx}{d\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### 52. Template 1

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=4+\cos\left(\theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
dy/dx=\frac{\left(-\left(\sin\left(\theta\right)\right)\right)\cdot \sin\left(\theta\right)+\left(4+\cos\left(\theta\right)\right)\cdot \cos\left(\theta\right)}{\left(-\left(\sin\left(\theta\right)\right)\right)\cdot \cos\left(\theta\right)+\left(4+\cos\left(\theta\right)\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:1:skill-examples-2026-09-19:polar:template-1`
- Seed: `skill-examples-2026-09-19:polar:template-1`
- Template: 1 (the generator's second structure)
- Generator version: `1.1.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: \frac{dx}{d\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

