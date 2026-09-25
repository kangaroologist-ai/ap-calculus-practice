# Derivative Studio: Skill Examples

Real generated examples for every basic and mixed template in `src/catalog.ts`.
The student-facing prompts are in English; each skill has a Chinese type note for teacher review.

Generated from `generateQuestion` version `2.0.0`; 26 skills, 101 total basic/mix templates and 101 questions.

> The answers preserve the production generator's expression tree, so an unsimplified form may appear. Equivalent expressions are accepted by the app's grader.

## Coverage and verification

Every question below was generated with a fixed seed and an explicit stable template key. The verification pass checked the catalog skill ID, role, level, template key, generator version, source/answer presence, and the answer tree recomputed from the production derivative rules. Inverse-function answers were additionally checked numerically as the reciprocal of the original derivative at the matching input.

| Skill ID | Level | Basic | Mixed | Verification |
| --- | ---: | ---: | ---: | --- |
| `constant` | 1 | 2 | 1 | verified |
| `power` | 1 | 2 | 2 | verified |
| `sum` | 1 | 1 | 2 | verified |
| `root` | 1 | 2 | 1 | verified |
| `exp` | 2 | 2 | 2 | verified |
| `log` | 2 | 2 | 2 | verified |
| `sin` | 2 | 2 | 2 | verified |
| `cos` | 2 | 2 | 2 | verified |
| `tan` | 2 | 2 | 2 | verified |
| `cot` | 2 | 2 | 2 | verified |
| `sec` | 2 | 2 | 2 | verified |
| `csc` | 2 | 2 | 2 | verified |
| `asin` | 2 | 2 | 2 | verified |
| `acos` | 2 | 2 | 2 | verified |
| `atan` | 2 | 2 | 2 | verified |
| `product` | 3 | 2 | 2 | verified |
| `quotient` | 3 | 2 | 2 | verified |
| `chain` | 3 | 2 | 2 | verified |
| `nested` | 4 | 2 | 2 | verified |
| `mixed` | 4 | 2 | 2 | verified |
| `implicit` | 5 | 2 | 2 | verified |
| `inverse` | 5 | 2 | 2 | verified |
| `higher` | 5 | 2 | 2 | verified |
| `parametric` | 6 | 2 | 2 | verified |
| `vector` | 6 | 2 | 2 | verified |
| `polar` | 6 | 2 | 2 | verified |

## Examples

### constant — Constants

**题型说明（中文）:** 常数函数：常数没有变化，导数为零。

**English focus:** Differentiate a constant.

**Rule / definition:** The derivative of a constant is zero.

#### Basic

##### 1. `constant.basic.forms`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{13}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=0
\]

**Production metadata.**

- Generator ID: `constant:0:skill-examples-2026-09-19:constant:constant.basic.forms`
- Seed: `skill-examples-2026-09-19:constant:constant.basic.forms`
- Template: 0 (basic)
- Template key: `constant.basic.forms`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 2. `constant.basic.rational`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=14+\frac{7}{7}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=0
\]

**Production metadata.**

- Generator ID: `constant:1:skill-examples-2026-09-19:constant:constant.basic.rational`
- Seed: `skill-examples-2026-09-19:constant:constant.basic.rational`
- Template: 1 (basic)
- Template key: `constant.basic.rational`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 3. `constant.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=9+9\cdot x^{7}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=9\cdot 7\cdot x^{6}
\]

**Production metadata.**

- Generator ID: `constant:2:skill-examples-2026-09-19:constant:constant.mix.power_sum`
- Seed: `skill-examples-2026-09-19:constant:constant.mix.power_sum`
- Template: 2 (mix)
- Template key: `constant.mix.power_sum`
- Generator version: `2.0.0`
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

#### Basic

##### 4. `power.basic.positive`

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

- Generator ID: `power:0:skill-examples-2026-09-19:power:power.basic.positive`
- Seed: `skill-examples-2026-09-19:power:power.basic.positive`
- Template: 0 (basic)
- Template key: `power.basic.positive`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 5. `power.basic.negative`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{-7}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\left(-7\right)\cdot x^{-8}
\]

**Production metadata.**

- Generator ID: `power:1:skill-examples-2026-09-19:power:power.basic.negative`
- Seed: `skill-examples-2026-09-19:power:power.basic.negative`
- Template: 1 (basic)
- Template key: `power.basic.negative`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 6. `power.mix.polynomial_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=6\cdot x^{4}+7\cdot x^{2}+4
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=6\cdot 4\cdot x^{3}+7\cdot 2\cdot x
\]

**Production metadata.**

- Generator ID: `power:2:skill-examples-2026-09-19:power:power.mix.polynomial_sum`
- Seed: `skill-examples-2026-09-19:power:power.mix.polynomial_sum`
- Template: 2 (mix)
- Template key: `power.mix.polynomial_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 7. `power.mix.negative_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7\cdot x^{-8}+2\cdot x
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=7\cdot \left(-8\right)\cdot x^{-9}+2
\]

**Production metadata.**

- Generator ID: `power:3:skill-examples-2026-09-19:power:power.mix.negative_sum`
- Seed: `skill-examples-2026-09-19:power:power.mix.negative_sum`
- Template: 3 (mix)
- Template key: `power.mix.negative_sum`
- Generator version: `2.0.0`
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

#### Basic

##### 8. `sum.basic.polynomial_linear`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=11\cdot x^{3}+14\cdot x+9
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=11\cdot 3\cdot x^{2}+14
\]

**Production metadata.**

- Generator ID: `sum:0:skill-examples-2026-09-19:sum:sum.basic.polynomial_linear`
- Seed: `skill-examples-2026-09-19:sum:sum.basic.polynomial_linear`
- Template: 0 (basic)
- Template key: `sum.basic.polynomial_linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 9. `sum.mix.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5\cdot \sqrt{x}+10\cdot x^{4}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \frac{1}{2\cdot \sqrt{x}}+10\cdot 4\cdot x^{3}
\]

**Production metadata.**

- Generator ID: `sum:1:skill-examples-2026-09-19:sum:sum.mix.square_root`
- Seed: `skill-examples-2026-09-19:sum:sum.mix.square_root`
- Template: 1 (mix)
- Template key: `sum.mix.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 10. `sum.mix.fractional_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=2\cdot x^{-7}+13\cdot x^{\frac{2}{5}}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot \left(-7\right)\cdot x^{-8}+13\cdot \frac{2}{5}\cdot x^{\frac{-3}{5}}
\]

**Production metadata.**

- Generator ID: `sum:2:skill-examples-2026-09-19:sum:sum.mix.fractional_root`
- Seed: `skill-examples-2026-09-19:sum:sum.mix.fractional_root`
- Template: 2 (mix)
- Template key: `sum.mix.fractional_root`
- Generator version: `2.0.0`
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

#### Basic

##### 11. `root.basic.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=14\cdot \sqrt{x}
\]

**Definition / validity conditions.** For the square-root template, use x > 0 for the derivative (the function itself is real for x ≥ 0).

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=14\cdot \frac{1}{2}\cdot x^{\frac{-1}{2}}
\]

**Production metadata.**

- Generator ID: `root:0:skill-examples-2026-09-19:root:root.basic.square_root`
- Seed: `skill-examples-2026-09-19:root:root.basic.square_root`
- Template: 0 (basic)
- Template key: `root.basic.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 12. `root.basic.fractional_power`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=6\cdot x^{\frac{4}{3}}
\]

**Definition / validity conditions.** For the odd-root template (an odd-denominator rational exponent, e.g. cube or fifth root), the real function is defined for every x, but its derivative is undefined at x = 0. Thus x ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=6\cdot \frac{4}{3}\cdot x^{\frac{1}{3}}
\]

**Production metadata.**

- Generator ID: `root:1:skill-examples-2026-09-19:root:root.basic.fractional_power`
- Seed: `skill-examples-2026-09-19:root:root.basic.fractional_power`
- Template: 1 (basic)
- Template key: `root.basic.fractional_power`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-5, -0.1], [0.1, 5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 13. `root.mix.square_root_power`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=6\cdot \sqrt{x}+7\cdot x^{5}
\]

**Definition / validity conditions.** For the square-root template, use x > 0 for the derivative (the function itself is real for x ≥ 0).

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=6\cdot \frac{1}{2\cdot \sqrt{x}}+7\cdot 5\cdot x^{4}
\]

**Production metadata.**

- Generator ID: `root:2:skill-examples-2026-09-19:root:root.mix.square_root_power`
- Seed: `skill-examples-2026-09-19:root:root.mix.square_root_power`
- Template: 2 (mix)
- Template key: `root.mix.square_root_power`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### exp — Exponential functions

**题型说明（中文）:** 指数函数：外层指数函数乘以内层导数；其他底数还要乘以 ln(底数)。

**English focus:** Differentiate an exponential function, including its inner derivative.

**Rule / definition:** For e to a function, multiply by the inner derivative; for another base, also multiply by its natural logarithm.

#### Basic

##### 14. `exp.basic.natural`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=2\cdot e^{x}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `exp:0:skill-examples-2026-09-19:exp:exp.basic.natural`
- Seed: `skill-examples-2026-09-19:exp:exp.basic.natural`
- Template: 0 (basic)
- Template key: `exp.basic.natural`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 15. `exp.basic.base`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot 12^{x}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot 12^{x}\cdot \ln\left(12\right)
\]

**Production metadata.**

- Generator ID: `exp:1:skill-examples-2026-09-19:exp:exp.basic.base`
- Seed: `skill-examples-2026-09-19:exp:exp.basic.base`
- Template: 1 (basic)
- Template key: `exp.basic.base`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 16. `exp.mix.polynomial`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=10\cdot e^{x}+5\cdot x^{2}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=10\cdot e^{x}+5\cdot 2\cdot x
\]

**Production metadata.**

- Generator ID: `exp:2:skill-examples-2026-09-19:exp:exp.mix.polynomial`
- Seed: `skill-examples-2026-09-19:exp:exp.mix.polynomial`
- Template: 2 (mix)
- Template key: `exp.mix.polynomial`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 17. `exp.mix.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{x}+7\cdot \sqrt{x}
\]

**Definition / validity conditions.** The displayed exponential is real and differentiable for every real x. Angles, when present, are measured in radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=e^{x}+7\cdot \frac{1}{2\cdot \sqrt{x}}
\]

**Production metadata.**

- Generator ID: `exp:3:skill-examples-2026-09-19:exp:exp.mix.square_root`
- Seed: `skill-examples-2026-09-19:exp:exp.mix.square_root`
- Template: 3 (mix)
- Template key: `exp.mix.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### log — Logarithmic functions

**题型说明（中文）:** 对数函数：ln(u) 的导数为 u′/u；换底后分母出现 ln(底数)。

**English focus:** Differentiate a logarithmic function on its real domain.

**Rule / definition:** The derivative of ln(u) is u′/u; a different base adds a logarithm in the denominator.

#### Basic

##### 18. `log.basic.natural`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=6\cdot \ln\left(x\right)
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=6\cdot \frac{1}{x}
\]

**Production metadata.**

- Generator ID: `log:0:skill-examples-2026-09-19:log:log.basic.natural`
- Seed: `skill-examples-2026-09-19:log:log.basic.natural`
- Template: 0 (basic)
- Template key: `log.basic.natural`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 19. `log.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{5\cdot \ln\left(x\right)}{\ln\left(8\right)}
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{5\cdot \frac{1}{x}\cdot \ln\left(8\right)}{\left(\ln\left(8\right)\right)^{2}}
\]

**Production metadata.**

- Generator ID: `log:1:skill-examples-2026-09-19:log:log.basic.scaled`
- Seed: `skill-examples-2026-09-19:log:log.basic.scaled`
- Template: 1 (basic)
- Template key: `log.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 20. `log.mix.polynomial`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=11\cdot \ln\left(x\right)+4\cdot x^{7}
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=11\cdot \frac{1}{x}+4\cdot 7\cdot x^{6}
\]

**Production metadata.**

- Generator ID: `log:2:skill-examples-2026-09-19:log:log.mix.polynomial`
- Seed: `skill-examples-2026-09-19:log:log.mix.polynomial`
- Template: 2 (mix)
- Template key: `log.mix.polynomial`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 21. `log.mix.exponential`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\ln\left(x\right)-\left(6\cdot e^{x}\right)
\]

**Definition / validity conditions.** The logarithm requires a positive argument; here the displayed argument must be > 0. The base is valid because it is positive and not 1.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{1}{x}-\left(6\cdot e^{x}\right)
\]

**Production metadata.**

- Generator ID: `log:3:skill-examples-2026-09-19:log:log.mix.exponential`
- Seed: `skill-examples-2026-09-19:log:log.mix.exponential`
- Template: 3 (mix)
- Template key: `log.mix.exponential`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### sin — Sine

**题型说明（中文）:** 正弦函数：使用 sin(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a sine function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 22. `sin.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=13\cdot \sin\left(x\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=13\cdot \cos\left(x\right)
\]

**Production metadata.**

- Generator ID: `sin:0:skill-examples-2026-09-19:sin:sin.basic.scaled`
- Seed: `skill-examples-2026-09-19:sin:sin.basic.scaled`
- Template: 0 (basic)
- Template key: `sin.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 23. `sin.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\sin\left(x\right)}{13}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\cos\left(x\right)\cdot 13}{13^{2}}
\]

**Production metadata.**

- Generator ID: `sin:1:skill-examples-2026-09-19:sin:sin.basic.divided`
- Seed: `skill-examples-2026-09-19:sin:sin.basic.divided`
- Template: 1 (basic)
- Template key: `sin.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 24. `sin.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \sin\left(x\right)+10\cdot x^{2}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \cos\left(x\right)+10\cdot 2\cdot x
\]

**Production metadata.**

- Generator ID: `sin:2:skill-examples-2026-09-19:sin:sin.mix.power_sum`
- Seed: `skill-examples-2026-09-19:sin:sin.mix.power_sum`
- Template: 2 (mix)
- Template key: `sin.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 25. `sin.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=3\cdot \sin\left(x\right)+5\cdot e^{x}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot \cos\left(x\right)+5\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `sin:3:skill-examples-2026-09-19:sin:sin.mix.function_sum`
- Seed: `skill-examples-2026-09-19:sin:sin.mix.function_sum`
- Template: 3 (mix)
- Template key: `sin.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### cos — Cosine

**题型说明（中文）:** 余弦函数：使用 −sin(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cosine function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 26. `cos.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=10\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=10\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `cos:0:skill-examples-2026-09-19:cos:cos.basic.scaled`
- Seed: `skill-examples-2026-09-19:cos:cos.basic.scaled`
- Template: 0 (basic)
- Template key: `cos.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 27. `cos.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\cos\left(x\right)}{15}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(-\left(\sin\left(x\right)\right)\right)\cdot 15}{15^{2}}
\]

**Production metadata.**

- Generator ID: `cos:1:skill-examples-2026-09-19:cos:cos.basic.divided`
- Seed: `skill-examples-2026-09-19:cos:cos.basic.divided`
- Template: 1 (basic)
- Template key: `cos.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 28. `cos.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=13\cdot \cos\left(x\right)+9\cdot x^{6}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=13\cdot \left(-\left(\sin\left(x\right)\right)\right)+9\cdot 6\cdot x^{5}
\]

**Production metadata.**

- Generator ID: `cos:2:skill-examples-2026-09-19:cos:cos.mix.power_sum`
- Seed: `skill-examples-2026-09-19:cos:cos.mix.power_sum`
- Template: 2 (mix)
- Template key: `cos.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 29. `cos.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=7\cdot \cos\left(x\right)+9\cdot e^{x}
\]

**Definition / validity conditions.** Sine and cosine are real and differentiable for every real input; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=7\cdot \left(-\left(\sin\left(x\right)\right)\right)+9\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `cos:3:skill-examples-2026-09-19:cos:cos.mix.function_sum`
- Seed: `skill-examples-2026-09-19:cos:cos.mix.function_sum`
- Template: 3 (mix)
- Template key: `cos.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### tan — Tangent

**题型说明（中文）:** 正切函数：使用 sec²(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a tangent function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 30. `tan.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=4\cdot \tan\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot \left(\sec\left(x\right)\right)^{2}
\]

**Production metadata.**

- Generator ID: `tan:0:skill-examples-2026-09-19:tan:tan.basic.scaled`
- Seed: `skill-examples-2026-09-19:tan:tan.basic.scaled`
- Template: 0 (basic)
- Template key: `tan.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 31. `tan.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\tan\left(x\right)}{14}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(\sec\left(x\right)\right)^{2}\cdot 14}{14^{2}}
\]

**Production metadata.**

- Generator ID: `tan:1:skill-examples-2026-09-19:tan:tan.basic.divided`
- Seed: `skill-examples-2026-09-19:tan:tan.basic.divided`
- Template: 1 (basic)
- Template key: `tan.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 32. `tan.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \tan\left(x\right)+14\cdot x^{4}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \left(\sec\left(x\right)\right)^{2}+14\cdot 4\cdot x^{3}
\]

**Production metadata.**

- Generator ID: `tan:2:skill-examples-2026-09-19:tan:tan.mix.power_sum`
- Seed: `skill-examples-2026-09-19:tan:tan.mix.power_sum`
- Template: 2 (mix)
- Template key: `tan.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 33. `tan.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=12\cdot \tan\left(x\right)+2\cdot e^{x}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=12\cdot \left(\sec\left(x\right)\right)^{2}+2\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `tan:3:skill-examples-2026-09-19:tan:tan.mix.function_sum`
- Seed: `skill-examples-2026-09-19:tan:tan.mix.function_sum`
- Template: 3 (mix)
- Template key: `tan.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### cot — Cotangent

**题型说明（中文）:** 余切函数：使用 −csc²(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cotangent function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 34. `cot.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=10\cdot \cot\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=10\cdot \left(-\left(\left(\csc\left(x\right)\right)^{2}\right)\right)
\]

**Production metadata.**

- Generator ID: `cot:0:skill-examples-2026-09-19:cot:cot.basic.scaled`
- Seed: `skill-examples-2026-09-19:cot:cot.basic.scaled`
- Template: 0 (basic)
- Template key: `cot.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 35. `cot.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\cot\left(x\right)}{8}
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(-\left(\left(\csc\left(x\right)\right)^{2}\right)\right)\cdot 8}{8^{2}}
\]

**Production metadata.**

- Generator ID: `cot:1:skill-examples-2026-09-19:cot:cot.basic.divided`
- Seed: `skill-examples-2026-09-19:cot:cot.basic.divided`
- Template: 1 (basic)
- Template key: `cot.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 36. `cot.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \cot\left(x\right)+9\cdot x^{4}
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \left(-\left(\left(\csc\left(x\right)\right)^{2}\right)\right)+9\cdot 4\cdot x^{3}
\]

**Production metadata.**

- Generator ID: `cot:2:skill-examples-2026-09-19:cot:cot.mix.power_sum`
- Seed: `skill-examples-2026-09-19:cot:cot.mix.power_sum`
- Template: 2 (mix)
- Template key: `cot.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 37. `cot.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5\cdot \cot\left(x\right)+5\cdot e^{x}
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \left(-\left(\left(\csc\left(x\right)\right)^{2}\right)\right)+5\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `cot:3:skill-examples-2026-09-19:cot:cot.mix.function_sum`
- Seed: `skill-examples-2026-09-19:cot:cot.mix.function_sum`
- Template: 3 (mix)
- Template key: `cot.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### sec — Secant

**题型说明（中文）:** 正割函数：使用 sec(u)tan(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a secant function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 38. `sec.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=14\cdot \sec\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=14\cdot \sec\left(x\right)\cdot \tan\left(x\right)
\]

**Production metadata.**

- Generator ID: `sec:0:skill-examples-2026-09-19:sec:sec.basic.scaled`
- Seed: `skill-examples-2026-09-19:sec:sec.basic.scaled`
- Template: 0 (basic)
- Template key: `sec.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 39. `sec.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\sec\left(x\right)}{2}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\sec\left(x\right)\cdot \tan\left(x\right)\cdot 2}{2^{2}}
\]

**Production metadata.**

- Generator ID: `sec:1:skill-examples-2026-09-19:sec:sec.basic.divided`
- Seed: `skill-examples-2026-09-19:sec:sec.basic.divided`
- Template: 1 (basic)
- Template key: `sec.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 40. `sec.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5\cdot \sec\left(x\right)+13\cdot x^{8}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \sec\left(x\right)\cdot \tan\left(x\right)+13\cdot 8\cdot x^{7}
\]

**Production metadata.**

- Generator ID: `sec:2:skill-examples-2026-09-19:sec:sec.mix.power_sum`
- Seed: `skill-examples-2026-09-19:sec:sec.mix.power_sum`
- Template: 2 (mix)
- Template key: `sec.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 41. `sec.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=14\cdot \sec\left(x\right)+13\cdot e^{x}
\]

**Definition / validity conditions.** The derivative is valid where cos(u) ≠ 0, so the displayed tangent/secant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=14\cdot \sec\left(x\right)\cdot \tan\left(x\right)+13\cdot e^{x}
\]

**Production metadata.**

- Generator ID: `sec:3:skill-examples-2026-09-19:sec:sec.mix.function_sum`
- Seed: `skill-examples-2026-09-19:sec:sec.mix.function_sum`
- Template: 3 (mix)
- Template key: `sec.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### csc — Cosecant

**题型说明（中文）:** 余割函数：使用 −csc(u)cot(u) 的基本导数，并乘以内层导数。

**English focus:** Differentiate a cosecant function, including its inner derivative.

**Rule / definition:** Use the basic trigonometric derivative and include any inner derivative.

#### Basic

##### 42. `csc.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=12\cdot \csc\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=12\cdot \left(-\left(\csc\left(x\right)\cdot \cot\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `csc:0:skill-examples-2026-09-19:csc:csc.basic.scaled`
- Seed: `skill-examples-2026-09-19:csc:csc.basic.scaled`
- Template: 0 (basic)
- Template key: `csc.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 43. `csc.basic.divided`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\csc\left(x\right)}{11}
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(-\left(\csc\left(x\right)\cdot \cot\left(x\right)\right)\right)\cdot 11}{11^{2}}
\]

**Production metadata.**

- Generator ID: `csc:1:skill-examples-2026-09-19:csc:csc.basic.divided`
- Seed: `skill-examples-2026-09-19:csc:csc.basic.divided`
- Template: 1 (basic)
- Template key: `csc.basic.divided`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 44. `csc.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=4\cdot \csc\left(x\right)+8\cdot x^{7}
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=4\cdot \left(-\left(\csc\left(x\right)\cdot \cot\left(x\right)\right)\right)+8\cdot 7\cdot x^{6}
\]

**Production metadata.**

- Generator ID: `csc:2:skill-examples-2026-09-19:csc:csc.mix.power_sum`
- Seed: `skill-examples-2026-09-19:csc:csc.mix.power_sum`
- Template: 2 (mix)
- Template key: `csc.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 45. `csc.mix.function_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=2\cdot \csc\left(x\right)+15\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** The derivative is valid where sin(u) ≠ 0, so the displayed cotangent/cosecant expression is defined. Use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot \left(-\left(\csc\left(x\right)\cdot \cot\left(x\right)\right)\right)+15\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `csc:3:skill-examples-2026-09-19:csc:csc.mix.function_sum`
- Seed: `skill-examples-2026-09-19:csc:csc.mix.function_sum`
- Template: 3 (mix)
- Template key: `csc.mix.function_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### asin — Arcsine

**题型说明（中文）:** 反正弦函数：使用 1/√(1−u²)，并满足实数定义域。

**English focus:** Differentiate an inverse-sine function on the interior of its real domain.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### Basic

##### 46. `asin.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=11\cdot \arcsin\left(x\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=11\cdot \frac{1}{\sqrt{1-\left(x^{2}\right)}}
\]

**Production metadata.**

- Generator ID: `asin:0:skill-examples-2026-09-19:asin:asin.basic.scaled`
- Seed: `skill-examples-2026-09-19:asin:asin.basic.scaled`
- Template: 0 (basic)
- Template key: `asin.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 47. `asin.basic.divided_value`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\arcsin\left(x\right)}{9}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\frac{1}{\sqrt{1-\left(x^{2}\right)}}\cdot 9}{9^{2}}
\]

**Production metadata.**

- Generator ID: `asin:1:skill-examples-2026-09-19:asin:asin.basic.divided_value`
- Seed: `skill-examples-2026-09-19:asin:asin.basic.divided_value`
- Template: 1 (basic)
- Template key: `asin.basic.divided_value`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 48. `asin.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=12\cdot \arcsin\left(x\right)+5\cdot x^{6}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=12\cdot \frac{1}{\sqrt{1-\left(x^{2}\right)}}+5\cdot 6\cdot x^{5}
\]

**Production metadata.**

- Generator ID: `asin:2:skill-examples-2026-09-19:asin:asin.mix.power_sum`
- Seed: `skill-examples-2026-09-19:asin:asin.mix.power_sum`
- Template: 2 (mix)
- Template key: `asin.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 49. `asin.mix.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arcsin\left(x\right)+5\cdot \sqrt{x}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{1}{\sqrt{1-\left(x^{2}\right)}}+5\cdot \frac{1}{2\cdot \sqrt{x}}
\]

**Production metadata.**

- Generator ID: `asin:3:skill-examples-2026-09-19:asin:asin.mix.square_root`
- Seed: `skill-examples-2026-09-19:asin:asin.mix.square_root`
- Template: 3 (mix)
- Template key: `asin.mix.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### acos — Arccosine

**题型说明（中文）:** 反余弦函数：使用 −1/√(1−u²)，并满足实数定义域。

**English focus:** Differentiate an inverse-cosine function on the interior of its real domain.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### Basic

##### 50. `acos.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \arccos\left(x\right)
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \left(-\left(\frac{1}{\sqrt{1-\left(x^{2}\right)}}\right)\right)
\]

**Production metadata.**

- Generator ID: `acos:0:skill-examples-2026-09-19:acos:acos.basic.scaled`
- Seed: `skill-examples-2026-09-19:acos:acos.basic.scaled`
- Template: 0 (basic)
- Template key: `acos.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 51. `acos.basic.divided_value`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\arccos\left(x\right)}{8}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(-\left(\frac{1}{\sqrt{1-\left(x^{2}\right)}}\right)\right)\cdot 8}{8^{2}}
\]

**Production metadata.**

- Generator ID: `acos:1:skill-examples-2026-09-19:acos:acos.basic.divided_value`
- Seed: `skill-examples-2026-09-19:acos:acos.basic.divided_value`
- Template: 1 (basic)
- Template key: `acos.basic.divided_value`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 52. `acos.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=3\cdot \arccos\left(x\right)+6\cdot x^{7}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot \left(-\left(\frac{1}{\sqrt{1-\left(x^{2}\right)}}\right)\right)+6\cdot 7\cdot x^{6}
\]

**Production metadata.**

- Generator ID: `acos:2:skill-examples-2026-09-19:acos:acos.mix.power_sum`
- Seed: `skill-examples-2026-09-19:acos:acos.mix.power_sum`
- Template: 2 (mix)
- Template key: `acos.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 53. `acos.mix.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arccos\left(x\right)+12\cdot \sqrt{x}
\]

**Definition / validity conditions.** For a real derivative, the inner argument must satisfy |u| < 1; the endpoints ±1 are function-domain endpoints where the derivative formula is undefined.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\frac{1}{\sqrt{1-\left(x^{2}\right)}}\right)+12\cdot \frac{1}{2\cdot \sqrt{x}}
\]

**Production metadata.**

- Generator ID: `acos:3:skill-examples-2026-09-19:acos:acos.mix.square_root`
- Seed: `skill-examples-2026-09-19:acos:acos.mix.square_root`
- Template: 3 (mix)
- Template key: `acos.mix.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### atan — Arctangent

**题型说明（中文）:** 反正切函数：使用 1/(1+u²)，定义域为全体实数。

**English focus:** Differentiate an inverse-tangent function.

**Rule / definition:** Use the inverse-trigonometric derivative, with its real-domain restriction.

#### Basic

##### 54. `atan.basic.scaled`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=8\cdot \arctan\left(x\right)
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=8\cdot \frac{1}{1+x^{2}}
\]

**Production metadata.**

- Generator ID: `atan:0:skill-examples-2026-09-19:atan:atan.basic.scaled`
- Seed: `skill-examples-2026-09-19:atan:atan.basic.scaled`
- Template: 0 (basic)
- Template key: `atan.basic.scaled`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 55. `atan.basic.divided_value`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\arctan\left(x\right)}{4}
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\frac{1}{1+x^{2}}\cdot 4}{4^{2}}
\]

**Production metadata.**

- Generator ID: `atan:1:skill-examples-2026-09-19:atan:atan.basic.divided_value`
- Seed: `skill-examples-2026-09-19:atan:atan.basic.divided_value`
- Template: 1 (basic)
- Template key: `atan.basic.divided_value`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 56. `atan.mix.power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=12\cdot \arctan\left(x\right)+8\cdot x^{8}
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=12\cdot \frac{1}{1+x^{2}}+8\cdot 8\cdot x^{7}
\]

**Production metadata.**

- Generator ID: `atan:2:skill-examples-2026-09-19:atan:atan.mix.power_sum`
- Seed: `skill-examples-2026-09-19:atan:atan.mix.power_sum`
- Template: 2 (mix)
- Template key: `atan.mix.power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 57. `atan.mix.square_root`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\arctan\left(x\right)+7\cdot \sqrt{x}
\]

**Definition / validity conditions.** The inverse tangent is real and differentiable for every real input.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{1}{1+x^{2}}+7\cdot \frac{1}{2\cdot \sqrt{x}}
\]

**Production metadata.**

- Generator ID: `atan:3:skill-examples-2026-09-19:atan:atan.mix.square_root`
- Seed: `skill-examples-2026-09-19:atan:atan.mix.square_root`
- Template: 3 (mix)
- Template key: `atan.mix.square_root`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### product — Product rule

**题型说明（中文）:** 乘积法则：第一因子的导数乘第二因子，加第一因子乘第二因子的导数。

**English focus:** Apply the product rule.

**Rule / definition:** Differentiate the first factor times the second, plus the first times the derivative of the second.

#### Basic

##### 58. `product.basic.power_function`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{5}\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot x^{4}\cdot \cos\left(x\right)+x^{5}\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `product:0:skill-examples-2026-09-19:product:product.basic.power_function`
- Seed: `skill-examples-2026-09-19:product:product.basic.power_function`
- Template: 0 (basic)
- Template key: `product.basic.power_function`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 59. `product.basic.function_pair`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=5\cdot \cos\left(x\right)\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \left(-\left(\sin\left(x\right)\right)\right)\cdot \cos\left(x\right)+5\cdot \cos\left(x\right)\cdot \left(-\left(\sin\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `product:1:skill-examples-2026-09-19:product:product.basic.function_pair`
- Seed: `skill-examples-2026-09-19:product:product.basic.function_pair`
- Template: 1 (basic)
- Template key: `product.basic.function_pair`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 60. `product.mix.quadratic_function`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(x^{2}+4\right)\cdot \sin\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot x\cdot \sin\left(x\right)+\left(x^{2}+4\right)\cdot \cos\left(x\right)
\]

**Production metadata.**

- Generator ID: `product:2:skill-examples-2026-09-19:product:product.mix.quadratic_function`
- Seed: `skill-examples-2026-09-19:product:product.mix.quadratic_function`
- Template: 2 (mix)
- Template key: `product.mix.quadratic_function`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 61. `product.mix.tangent_secant`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=x^{3}\cdot \tan\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot x^{2}\cdot \tan\left(x\right)+x^{3}\cdot \left(\sec\left(x\right)\right)^{2}
\]

**Production metadata.**

- Generator ID: `product:3:skill-examples-2026-09-19:product:product.mix.tangent_secant`
- Seed: `skill-examples-2026-09-19:product:product.mix.tangent_secant`
- Template: 3 (mix)
- Template key: `product.mix.tangent_secant`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### quotient — Quotient rule

**题型说明（中文）:** 商法则：分子为 u′v−uv′，分母为 v²，保持顺序。

**English focus:** Apply the quotient rule.

**Rule / definition:** Use (u′v − uv′)/v². Keep the order in the numerator.

#### Basic

##### 62. `quotient.basic.polynomial_linear`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{x^{2}+12}{2\cdot x+12}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{2\cdot x\cdot \left(2\cdot x+12\right)-\left(\left(x^{2}+12\right)\cdot 2\right)}{\left(2\cdot x+12\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:0:skill-examples-2026-09-19:quotient:quotient.basic.polynomial_linear`
- Seed: `skill-examples-2026-09-19:quotient:quotient.basic.polynomial_linear`
- Template: 0 (basic)
- Template key: `quotient.basic.polynomial_linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 63. `quotient.basic.reciprocal_power`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{2}{x^{6}+13}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{-\left(2\cdot 6\cdot x^{5}\right)}{\left(x^{6}+13\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:1:skill-examples-2026-09-19:quotient:quotient.basic.reciprocal_power`
- Seed: `skill-examples-2026-09-19:quotient:quotient.basic.reciprocal_power`
- Template: 1 (basic)
- Template key: `quotient.basic.reciprocal_power`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 64. `quotient.mix.function_quadratic`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\cos\left(x\right)}{x^{2}+11}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(-\left(\sin\left(x\right)\right)\right)\cdot \left(x^{2}+11\right)-\left(\cos\left(x\right)\cdot 2\cdot x\right)}{\left(x^{2}+11\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:2:skill-examples-2026-09-19:quotient:quotient.mix.function_quadratic`
- Seed: `skill-examples-2026-09-19:quotient:quotient.mix.function_quadratic`
- Template: 2 (mix)
- Template key: `quotient.mix.function_quadratic`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 65. `quotient.mix.product_linear`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{x^{4}\cdot \cos\left(x\right)}{x+8}
\]

**Definition / validity conditions.** The denominator of the displayed quotient must be nonzero; the derivative is valid wherever both numerator and denominator are differentiable.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(4\cdot x^{3}\cdot \cos\left(x\right)+x^{4}\cdot \left(-\left(\sin\left(x\right)\right)\right)\right)\cdot \left(x+8\right)-\left(x^{4}\cdot \cos\left(x\right)\right)}{\left(x+8\right)^{2}}
\]

**Production metadata.**

- Generator ID: `quotient:3:skill-examples-2026-09-19:quotient:quotient.mix.product_linear`
- Seed: `skill-examples-2026-09-19:quotient:quotient.mix.product_linear`
- Template: 3 (mix)
- Template key: `quotient.mix.product_linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### chain — Chain rule

**题型说明（中文）:** 链式法则：先求外层函数在内层处的导数，再乘以内层导数。

**English focus:** Apply a single chain rule.

**Rule / definition:** Differentiate the outer function at the inner function, then multiply by the inner derivative.

#### Basic

##### 66. `chain.basic.power_linear`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(9\cdot x+3\right)^{5}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=5\cdot \left(9\cdot x+3\right)^{4}\cdot 9
\]

**Production metadata.**

- Generator ID: `chain:0:skill-examples-2026-09-19:chain:chain.basic.power_linear`
- Seed: `skill-examples-2026-09-19:chain:chain.basic.power_linear`
- Template: 0 (basic)
- Template key: `chain.basic.power_linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 67. `chain.basic.function_linear`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\sin\left(3\cdot x+1\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\cos\left(3\cdot x+1\right)\cdot 3
\]

**Production metadata.**

- Generator ID: `chain:1:skill-examples-2026-09-19:chain:chain.basic.function_linear`
- Seed: `skill-examples-2026-09-19:chain:chain.basic.function_linear`
- Template: 1 (basic)
- Template key: `chain.basic.function_linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 68. `chain.mix.function_power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\cos\left(x^{3}+5\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\sin\left(x^{3}+5\right)\cdot 3\cdot x^{2}\right)
\]

**Production metadata.**

- Generator ID: `chain:2:skill-examples-2026-09-19:chain:chain.mix.function_power_sum`
- Seed: `skill-examples-2026-09-19:chain:chain.mix.function_power_sum`
- Template: 2 (mix)
- Template key: `chain.mix.function_power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 69. `chain.mix.square_root_quadratic`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\sqrt{8\cdot x^{2}+6}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{8\cdot 2\cdot x}{2\cdot \sqrt{8\cdot x^{2}+6}}
\]

**Production metadata.**

- Generator ID: `chain:3:skill-examples-2026-09-19:chain:chain.mix.square_root_quadratic`
- Seed: `skill-examples-2026-09-19:chain:chain.mix.square_root_quadratic`
- Template: 3 (mix)
- Template key: `chain.mix.square_root_quadratic`
- Generator version: `2.0.0`
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

#### Basic

##### 70. `nested.basic.function_quadratic`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\cos\left(\left(3\cdot x+8\right)^{2}\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\sin\left(\left(3\cdot x+8\right)^{2}\right)\cdot 2\cdot \left(3\cdot x+8\right)\cdot 3\right)
\]

**Production metadata.**

- Generator ID: `nested:0:skill-examples-2026-09-19:nested:nested.basic.function_quadratic`
- Seed: `skill-examples-2026-09-19:nested:nested.basic.function_quadratic`
- Template: 0 (basic)
- Template key: `nested.basic.function_quadratic`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.8666666666666667, -2.733333333333333], [-2.6, -2.466666666666667]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 71. `nested.basic.function_pair`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\cos\left(\sin\left(4\cdot x+7\right)\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=-\left(\sin\left(\sin\left(4\cdot x+7\right)\right)\cdot \cos\left(4\cdot x+7\right)\cdot 4\right)
\]

**Production metadata.**

- Generator ID: `nested:1:skill-examples-2026-09-19:nested:nested.basic.function_pair`
- Seed: `skill-examples-2026-09-19:nested:nested.basic.function_pair`
- Template: 1 (basic)
- Template key: `nested.basic.function_pair`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-1.9, -1.8], [-1.7, -1.6]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 72. `nested.mix.function_power_sum`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=e^{\sin\left(x^{2}-2\right)}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=e^{\sin\left(x^{2}-2\right)}\cdot \cos\left(x^{2}-2\right)\cdot 2\cdot x
\]

**Production metadata.**

- Generator ID: `nested:2:skill-examples-2026-09-19:nested:nested.mix.function_power_sum`
- Seed: `skill-examples-2026-09-19:nested:nested.mix.function_power_sum`
- Template: 2 (mix)
- Template key: `nested.mix.function_power_sum`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 73. `nested.mix.power_outer`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(\cos\left(7\cdot x+4\right)+9\right)^{3}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=3\cdot \left(\cos\left(7\cdot x+4\right)+9\right)^{2}\cdot \left(-\left(\sin\left(7\cdot x+4\right)\cdot 7\right)\right)
\]

**Production metadata.**

- Generator ID: `nested:3:skill-examples-2026-09-19:nested:nested.mix.power_outer`
- Seed: `skill-examples-2026-09-19:nested:nested.mix.power_outer`
- Template: 3 (mix)
- Template key: `nested.mix.power_outer`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-0.6571428571428571, -0.6], [-0.5428571428571428, -0.4857142857142857]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### mixed — Mixed differentiation

**题型说明（中文）:** 混合求导：先识别最外层运算，再在各因子内部使用相应法则。

**English focus:** Combine product, quotient, and chain rules.

**Rule / definition:** Identify the outermost operation first, then apply the rules within each factor.

#### Basic

##### 74. `mixed.basic.product_chain`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\left(x^{2}+9\right)\cdot \cos\left(15\cdot x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=2\cdot x\cdot \cos\left(15\cdot x\right)+\left(x^{2}+9\right)\cdot \left(-\left(\sin\left(15\cdot x\right)\cdot 15\right)\right)
\]

**Production metadata.**

- Generator ID: `mixed:0:skill-examples-2026-09-19:mixed:mixed.basic.product_chain`
- Seed: `skill-examples-2026-09-19:mixed:mixed.basic.product_chain`
- Template: 0 (basic)
- Template key: `mixed.basic.product_chain`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 75. `mixed.basic.quotient_chain`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{\sin\left(6\cdot x+2\right)}{x^{2}+3}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\cos\left(6\cdot x+2\right)\cdot 6\cdot \left(x^{2}+3\right)-\left(\sin\left(6\cdot x+2\right)\cdot 2\cdot x\right)}{\left(x^{2}+3\right)^{2}}
\]

**Production metadata.**

- Generator ID: `mixed:1:skill-examples-2026-09-19:mixed:mixed.basic.quotient_chain`
- Seed: `skill-examples-2026-09-19:mixed:mixed.basic.quotient_chain`
- Template: 1 (basic)
- Template key: `mixed.basic.quotient_chain`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 76. `mixed.mix.quotient_power`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\frac{x^{2}\cdot \cos\left(7\cdot x+8\right)}{x+3}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{\left(2\cdot x\cdot \cos\left(7\cdot x+8\right)+x^{2}\cdot \left(-\left(\sin\left(7\cdot x+8\right)\cdot 7\right)\right)\right)\cdot \left(x+3\right)-\left(x^{2}\cdot \cos\left(7\cdot x+8\right)\right)}{\left(x+3\right)^{2}}
\]

**Production metadata.**

- Generator ID: `mixed:2:skill-examples-2026-09-19:mixed:mixed.mix.quotient_power`
- Seed: `skill-examples-2026-09-19:mixed:mixed.mix.quotient_power`
- Template: 2 (mix)
- Template key: `mixed.mix.quotient_power`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 1], [1.2, 3]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 77. `mixed.mix.log_product`

**Student question (English).** Differentiate the function shown below.

\[
f(x)=\ln\left(x^{2}+12\right)\cdot \sin\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'(x)=\frac{2\cdot x}{x^{2}+12}\cdot \sin\left(x\right)+\ln\left(x^{2}+12\right)\cdot \cos\left(x\right)
\]

**Production metadata.**

- Generator ID: `mixed:3:skill-examples-2026-09-19:mixed:mixed.mix.log_product`
- Seed: `skill-examples-2026-09-19:mixed:mixed.mix.log_product`
- Template: 3 (mix)
- Template key: `mixed.mix.log_product`
- Generator version: `2.0.0`
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

#### Basic

##### 78. `implicit.basic.ellipse`

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
3\cdot x^{2}+y^{2}-42=0
\]

**Definition / validity conditions.** Compare on the given curve, where y ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=-\left(\frac{3\cdot 2\cdot x}{2\cdot y}\right)
\]

**Production metadata.**

- Generator ID: `implicit:0:skill-examples-2026-09-19:implicit:implicit.basic.ellipse`
- Seed: `skill-examples-2026-09-19:implicit:implicit.basic.ellipse`
- Template: 0 (basic)
- Template key: `implicit.basic.ellipse`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve, where y ≠ 0.
- Validation intervals sampled by the app: [-3.18040877875785, -0.37416573867739417], [0.37416573867739417, 3.18040877875785]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 79. `implicit.basic.hyperbola`

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
4\cdot y^{2}-\left(x^{2}\right)-56=0
\]

**Definition / validity conditions.** Compare on the given curve, where y ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=-\left(\frac{-\left(2\cdot x\right)}{4\cdot 2\cdot y}\right)
\]

**Production metadata.**

- Generator ID: `implicit:1:skill-examples-2026-09-19:implicit:implicit.basic.hyperbola`
- Seed: `skill-examples-2026-09-19:implicit:implicit.basic.hyperbola`
- Template: 1 (basic)
- Template key: `implicit.basic.hyperbola`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve, where y ≠ 0.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 80. `implicit.mix.sine_curve`

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
x^{2}+11\cdot \sin\left(y\right)-12=0
\]

**Definition / validity conditions.** Compare on the given curve, where cos(y) ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=-\left(\frac{2\cdot x}{11\cdot \cos\left(y\right)}\right)
\]

**Production metadata.**

- Generator ID: `implicit:2:skill-examples-2026-09-19:implicit:implicit.mix.sine_curve`
- Seed: `skill-examples-2026-09-19:implicit:implicit.mix.sine_curve`
- Template: 2 (mix)
- Template key: `implicit.mix.sine_curve`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve, where cos(y) ≠ 0.
- Validation intervals sampled by the app: [-0.8, -0.3], [0.3, 0.8]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 81. `implicit.mix.exponential_curve`

**Student question (English).** For the curve shown below, find dy/dx by implicit differentiation.

\[
e^{y}+2\cdot x^{2}-21=0
\]

**Definition / validity conditions.** Compare on the given curve; the branch has x ≠ 0.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=-\left(\frac{2\cdot 2\cdot x}{e^{y}}\right)
\]

**Production metadata.**

- Generator ID: `implicit:3:skill-examples-2026-09-19:implicit:implicit.mix.exponential_curve`
- Seed: `skill-examples-2026-09-19:implicit:implicit.mix.exponential_curve`
- Template: 3 (mix)
- Template key: `implicit.mix.exponential_curve`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Compare on the given curve; the branch has x ≠ 0.
- Validation intervals sampled by the app: [-1, -0.2], [0.2, 1]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### inverse — Inverse-function derivatives

**题型说明（中文）:** 反函数导数：在对应点使用 (f⁻¹)′(a)=1/f′(b)。

**English focus:** Use the reciprocal derivative theorem for an inverse function.

**Rule / definition:** Use (f⁻¹)′(a)=1/f′(b), where f(b)=a and f′(b) is nonzero.

#### Basic

##### 82. `inverse.basic.linear`

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=10\cdot x+7,\quad f(7)=77.\quad (f^{-1})'(77)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(77)=\frac{1}{10}
\]

**Production metadata.**

- Generator ID: `inverse:0:skill-examples-2026-09-19:inverse:inverse.basic.linear`
- Seed: `skill-examples-2026-09-19:inverse:inverse.basic.linear`
- Template: 0 (basic)
- Template key: `inverse.basic.linear`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 83. `inverse.basic.cubic`

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=x^{3}+10\cdot x,\quad f(4)=104.\quad (f^{-1})'(104)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(104)=\frac{1}{58}
\]

**Production metadata.**

- Generator ID: `inverse:1:skill-examples-2026-09-19:inverse:inverse.basic.cubic`
- Seed: `skill-examples-2026-09-19:inverse:inverse.basic.cubic`
- Template: 1 (basic)
- Template key: `inverse.basic.cubic`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 84. `inverse.mix.linear_exponential`

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=13\cdot x+e^{x},\quad f(0)=1.\quad (f^{-1})'(1)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(1)=\frac{1}{14}
\]

**Production metadata.**

- Generator ID: `inverse:2:skill-examples-2026-09-19:inverse:inverse.mix.linear_exponential`
- Seed: `skill-examples-2026-09-19:inverse:inverse.mix.linear_exponential`
- Template: 2 (mix)
- Template key: `inverse.mix.linear_exponential`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 85. `inverse.mix.cubic_sine`

**Student question (English).** Use the inverse-function derivative theorem to find the requested value.

\[
f(x)=x^{3}+10\cdot x+4\cdot \sin\left(x\right),\quad f(0)=0.\quad (f^{-1})'(0)=?
\]

**Definition / validity conditions.** Use the corresponding input b shown in f(b)=a. The inverse-function theorem requires f′(b) ≠ 0 and a local inverse at that point.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
(f⁻¹)'(0)=\frac{1}{14}
\]

**Production metadata.**

- Generator ID: `inverse:3:skill-examples-2026-09-19:inverse:inverse.mix.cubic_sine`
- Seed: `skill-examples-2026-09-19:inverse:inverse.mix.cubic_sine`
- Template: 3 (mix)
- Template key: `inverse.mix.cubic_sine`
- Generator version: `2.0.0`
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

#### Basic

##### 86. `higher.basic.second_polynomial`

**Student question (English).** For the function shown below, find the second derivative.

\[
f(x)=x^{3}+11\cdot x^{2}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f''(x)=3\cdot 2\cdot x+11\cdot 2
\]

**Production metadata.**

- Generator ID: `higher:0:skill-examples-2026-09-19:higher:higher.basic.second_polynomial`
- Seed: `skill-examples-2026-09-19:higher:higher.basic.second_polynomial`
- Template: 0 (basic)
- Template key: `higher.basic.second_polynomial`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 87. `higher.basic.third_power`

**Student question (English).** For the function shown below, find the third derivative.

\[
f(x)=5\cdot x^{9}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'''(x)=5\cdot 9\cdot 8\cdot 7\cdot x^{6}
\]

**Production metadata.**

- Generator ID: `higher:1:skill-examples-2026-09-19:higher:higher.basic.third_power`
- Seed: `skill-examples-2026-09-19:higher:higher.basic.third_power`
- Template: 1 (basic)
- Template key: `higher.basic.third_power`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 88. `higher.mix.third_chain`

**Student question (English).** For the function shown below, find the third derivative.

\[
f(x)=3\cdot e^{3\cdot x}
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f'''(x)=3\cdot e^{3\cdot x}\cdot 3\cdot 3\cdot 3
\]

**Production metadata.**

- Generator ID: `higher:2:skill-examples-2026-09-19:higher:higher.mix.third_chain`
- Seed: `skill-examples-2026-09-19:higher:higher.mix.third_chain`
- Template: 2 (mix)
- Template key: `higher.mix.third_chain`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2.5, -0.2], [0.2, 2.5]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 89. `higher.mix.second_product`

**Student question (English).** For the function shown below, find the second derivative.

\[
f(x)=x^{5}\cdot \cos\left(x\right)
\]

**Definition / validity conditions.** Work over the real domain of the displayed function and at points where the requested derivative exists.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
f''(x)=5\cdot 4\cdot x^{3}\cdot \cos\left(x\right)+5\cdot x^{4}\cdot \left(-\left(\sin\left(x\right)\right)\right)+5\cdot x^{4}\cdot \left(-\left(\sin\left(x\right)\right)\right)+x^{5}\cdot \left(-\left(\cos\left(x\right)\right)\right)
\]

**Production metadata.**

- Generator ID: `higher:3:skill-examples-2026-09-19:higher:higher.mix.second_product`
- Seed: `skill-examples-2026-09-19:higher:higher.mix.second_product`
- Template: 3 (mix)
- Template key: `higher.mix.second_product`
- Generator version: `2.0.0`
- Differentiation variable: `x`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### parametric — Parametric derivatives

**题型说明（中文）:** 参数方程导数：用 (dy/dt)/(dx/dt)；二阶导数还要再次除以 dx/dt。

**English focus:** Find a first or second derivative from parametric equations.

**Rule / definition:** Use dy/dx=(dy/dt)/(dx/dt). For the second derivative, differentiate the slope in t and divide by dx/dt again.

#### Basic

##### 90. `parametric.basic.linear_slope`

**Student question (English).** For the parametric equations below, find dy/dx in terms of t.

\[
x(t)=14\cdot t+7,\quad y(t)=t^{2}
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{2\cdot t}{14}
\]

**Production metadata.**

- Generator ID: `parametric:0:skill-examples-2026-09-19:parametric:parametric.basic.linear_slope`
- Seed: `skill-examples-2026-09-19:parametric:parametric.basic.linear_slope`
- Template: 0 (basic)
- Template key: `parametric.basic.linear_slope`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}t}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 91. `parametric.basic.power_second`

**Student question (English).** For the parametric equations below, find d²y/dx² in terms of t.

\[
x(t)=11\cdot t^{2},\quad y(t)=t^{5}
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}=\frac{\frac{5\cdot 4\cdot t^{3}\cdot 11\cdot 2\cdot t-\left(5\cdot t^{4}\cdot 11\cdot 2\right)}{\left(11\cdot 2\cdot t\right)^{2}}}{11\cdot 2\cdot t}
\]

**Production metadata.**

- Generator ID: `parametric:1:skill-examples-2026-09-19:parametric:parametric.basic.power_second`
- Seed: `skill-examples-2026-09-19:parametric:parametric.basic.power_second`
- Template: 1 (basic)
- Template key: `parametric.basic.power_second`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}t}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 92. `parametric.mix.exponential_product`

**Student question (English).** For the parametric equations below, find dy/dx in terms of t.

\[
x(t)=e^{t},\quad y(t)=7\cdot t\cdot e^{t}
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{7\cdot e^{t}+7\cdot t\cdot e^{t}}{e^{t}}
\]

**Production metadata.**

- Generator ID: `parametric:2:skill-examples-2026-09-19:parametric:parametric.mix.exponential_product`
- Seed: `skill-examples-2026-09-19:parametric:parametric.mix.exponential_product`
- Template: 2 (mix)
- Template key: `parametric.mix.exponential_product`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [0.2, 0.6], [0.7, 0.9]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}t}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 93. `parametric.mix.linear_chain`

**Student question (English).** For the parametric equations below, find dy/dx in terms of t.

\[
x(t)=15\cdot t+1,\quad y(t)=\sin\left(4\cdot t\right)
\]

**Definition / validity conditions.** Give the result in t and require dx/dt ≠ 0. The second-derivative template also requires the displayed derivatives to exist.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{\cos\left(4\cdot t\right)\cdot 4}{15}
\]

**Production metadata.**

- Generator ID: `parametric:3:skill-examples-2026-09-19:parametric:parametric.mix.linear_chain`
- Seed: `skill-examples-2026-09-19:parametric:parametric.mix.linear_chain`
- Template: 3 (mix)
- Template key: `parametric.mix.linear_chain`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Give your answer in t, where dx/dt ≠ 0.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}t}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### vector — Vector derivatives

**题型说明（中文）:** 向量函数导数：分别对每个分量关于参数求导。

**English focus:** Differentiate every component of a vector-valued function.

**Rule / definition:** Differentiate each component with respect to the parameter.

#### Basic

##### 94. `vector.basic.power_function`

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle t^{8},15\cdot \sin\left(t\right)\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle 8\cdot t^{7},\; 15\cdot \cos\left(t\right) \rangle
\]

**Production metadata.**

- Generator ID: `vector:0:skill-examples-2026-09-19:vector:vector.basic.power_function`
- Seed: `skill-examples-2026-09-19:vector:vector.basic.power_function`
- Template: 0 (basic)
- Template key: `vector.basic.power_function`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 95. `vector.basic.polynomial_exponential`

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle 13\cdot t^{5}+4,e^{t}\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle 13\cdot 5\cdot t^{4},\; e^{t} \rangle
\]

**Production metadata.**

- Generator ID: `vector:1:skill-examples-2026-09-19:vector:vector.basic.polynomial_exponential`
- Seed: `skill-examples-2026-09-19:vector:vector.basic.polynomial_exponential`
- Template: 1 (basic)
- Template key: `vector.basic.polynomial_exponential`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 96. `vector.mix.product_chain`

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle \left(t^{2}+4\right)\cdot e^{t},\cos\left(t^{2}\right)\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle 2\cdot t\cdot e^{t}+\left(t^{2}+4\right)\cdot e^{t},\; -\left(\sin\left(t^{2}\right)\cdot 2\cdot t\right) \rangle
\]

**Production metadata.**

- Generator ID: `vector:2:skill-examples-2026-09-19:vector:vector.mix.product_chain`
- Seed: `skill-examples-2026-09-19:vector:vector.mix.product_chain`
- Template: 2 (mix)
- Template key: `vector.mix.product_chain`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 97. `vector.mix.log_product`

**Student question (English).** Differentiate the vector function component by component to find r′(t).

\[
\mathbf{r}(t)=\langle \ln\left(t^{2}+9\right),t\cdot e^{t}\rangle
\]

**Definition / validity conditions.** Differentiate each component wherever that component derivative exists; use radians for the trigonometric component.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\langle \frac{2\cdot t}{t^{2}+9},\; e^{t}+t\cdot e^{t} \rangle
\]

**Production metadata.**

- Generator ID: `vector:3:skill-examples-2026-09-19:vector:vector.mix.log_product`
- Seed: `skill-examples-2026-09-19:vector:vector.mix.log_product`
- Template: 3 (mix)
- Template key: `vector.mix.log_product`
- Generator version: `2.0.0`
- Differentiation variable: `t`
- Generator domain text: Use radians. Give an expression valid wherever the derivative exists.
- Validation intervals sampled by the app: [-2, -0.2], [0.2, 2]
- Guard used by the app: none

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

### polar — Polar slopes

**题型说明（中文）:** 极坐标斜率：写成 x=r cosθ、y=r sinθ，再用 (dy/dθ)/(dx/dθ)。

**English focus:** Find the slope of a polar curve.

**Rule / definition:** Write x=r cos(θ), y=r sin(θ), then use (dy/dθ)/(dx/dθ).

#### Basic

##### 98. `polar.basic.sine_radius`

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=5+16\cdot \sin\left(\theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{16\cdot \cos\left(\theta\right)\cdot \sin\left(\theta\right)+\left(5+16\cdot \sin\left(\theta\right)\right)\cdot \cos\left(\theta\right)}{16\cdot \cos\left(\theta\right)\cdot \cos\left(\theta\right)+\left(5+16\cdot \sin\left(\theta\right)\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:0:skill-examples-2026-09-19:polar:polar.basic.sine_radius`
- Seed: `skill-examples-2026-09-19:polar:polar.basic.sine_radius`
- Template: 0 (basic)
- Template key: `polar.basic.sine_radius`
- Generator version: `2.0.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-0.1, -0.05], [0.05, 0.1]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 99. `polar.basic.cosine_radius`

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=2+6\cdot \cos\left(\theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{6\cdot \left(-\left(\sin\left(\theta\right)\right)\right)\cdot \sin\left(\theta\right)+\left(2+6\cdot \cos\left(\theta\right)\right)\cdot \cos\left(\theta\right)}{6\cdot \left(-\left(\sin\left(\theta\right)\right)\right)\cdot \cos\left(\theta\right)+\left(2+6\cdot \cos\left(\theta\right)\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:1:skill-examples-2026-09-19:polar:polar.basic.cosine_radius`
- Seed: `skill-examples-2026-09-19:polar:polar.basic.cosine_radius`
- Template: 1 (basic)
- Template key: `polar.basic.cosine_radius`
- Generator version: `2.0.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-0.1, -0.05], [0.05, 0.1]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

#### Mixed

##### 100. `polar.mix.sine_frequency`

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=3+\sin\left(2\cdot \theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{\cos\left(2\cdot \theta\right)\cdot 2\cdot \sin\left(\theta\right)+\left(3+\sin\left(2\cdot \theta\right)\right)\cdot \cos\left(\theta\right)}{\cos\left(2\cdot \theta\right)\cdot 2\cdot \cos\left(\theta\right)+\left(3+\sin\left(2\cdot \theta\right)\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:2:skill-examples-2026-09-19:polar:polar.mix.sine_frequency`
- Seed: `skill-examples-2026-09-19:polar:polar.mix.sine_frequency`
- Template: 2 (mix)
- Template key: `polar.mix.sine_frequency`
- Generator version: `2.0.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-0.1, -0.05], [0.05, 0.1]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

##### 101. `polar.mix.cosine_frequency`

**Student question (English).** For the polar curve below, find the slope dy/dx in terms of θ.

\[
r(\theta)=19+14\cdot \cos\left(2\cdot \theta\right)
\]

**Definition / validity conditions.** Write x = r cos(θ) and y = r sin(θ). The slope formula is valid where dx/dθ ≠ 0; use radians.

<details>
<summary>Answer and generator verification</summary>

**Answer.**

\[
\frac{\mathrm{d}y}{\mathrm{d}x}=\frac{14\cdot \left(-\left(\sin\left(2\cdot \theta\right)\cdot 2\right)\right)\cdot \sin\left(\theta\right)+\left(19+14\cdot \cos\left(2\cdot \theta\right)\right)\cdot \cos\left(\theta\right)}{14\cdot \left(-\left(\sin\left(2\cdot \theta\right)\cdot 2\right)\right)\cdot \cos\left(\theta\right)+\left(19+14\cdot \cos\left(2\cdot \theta\right)\right)\cdot \left(-\left(\sin\left(\theta\right)\right)\right)}
\]

**Production metadata.**

- Generator ID: `polar:3:skill-examples-2026-09-19:polar:polar.mix.cosine_frequency`
- Seed: `skill-examples-2026-09-19:polar:polar.mix.cosine_frequency`
- Template: 3 (mix)
- Template key: `polar.mix.cosine_frequency`
- Generator version: `2.0.0`
- Differentiation variable: `theta`
- Generator domain text: Give your answer in θ, where dx/dθ ≠ 0.
- Validation intervals sampled by the app: [-0.1, -0.05], [0.05, 0.1]
- Guard used by the app: \frac{\mathrm{d}x}{\mathrm{d}\theta}\ne 0

**Verified.** The answer was recomputed from the source expression using the production differentiation rules; this item passed the structural check.

</details>

