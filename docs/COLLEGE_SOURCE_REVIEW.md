# College course source and review record

The college material is original instruction with original examples and questions. Sources below were used to check formal methods and statistical distinctions, not to copy textbook questions or explanations. The lesson/question records identify the relevant source IDs; `data/courses.json` stores actual retrieval dates, scoped verification dates and SHA-256 hashes of the retrieved pages.

## Substantive first-party sources reviewed

OpenStax served substantive chapter text for the following sections, unlike the earlier Elementary Algebra landing-page JavaScript shell. Scoped verification dates are recorded individually in the source registry. This development-author review is not independent educator approval of Aptitude Beacon.

| Source | Checked scope |
|---|---|
| [College Algebra 2e — 1.2](https://openstax.org/books/college-algebra-2e/pages/1-2-exponents-and-scientific-notation) | Common-base product/quotient, zero/reciprocal rules and scientific scale; dated factual examples are not reused |
| [College Algebra 2e — 1.4](https://openstax.org/books/college-algebra-2e/pages/1-4-polynomials) | Polynomial degree, like terms, subtraction and distributed multiplication |
| [College Algebra 2e — 1.5](https://openstax.org/books/college-algebra-2e/pages/1-5-factoring-polynomials) | Factoring as equivalent multiplication and checking proposed factors |
| [College Algebra 2e — 2.2](https://openstax.org/books/college-algebra-2e/pages/2-2-linear-equations-in-one-variable) | Equality-preserving solving, conditional equations, identities and contradictions |
| [College Algebra 2e — 3.1](https://openstax.org/books/college-algebra-2e/pages/3-1-functions-and-function-notation) | One output per allowed input, domain/range and function notation |
| [College Algebra 2e — 3.3](https://openstax.org/books/college-algebra-2e/pages/3-3-rates-of-change-and-behavior-of-graphs) | Coordinate-based average rate of change and graph interpretation |
| [College Algebra 2e — 6.1](https://openstax.org/books/college-algebra-2e/pages/6-1-exponential-functions) | Additive versus multiplicative change; no dated population forecasts or real financial rates are reused |
| [Introductory Statistics 2e — 2.5](https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data) | Mean, median and frequency-weighted means |
| [Introductory Statistics 2e — 1.2](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling) | Population/sample distinctions, selection and random sampling terminology |
| [Introductory Statistics 2e — 1.4](https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics) | Observational confounding and random treatment assignment, with the qualifications below |
| [Introductory Statistics 2e — 2.7](https://openstax.org/books/introductory-statistics-2e/pages/2-7-measures-of-the-spread-of-the-data) | Variability as distinct from center; full standard-deviation calculation is not claimed as course coverage |

Random assignment is described in our instruction as balancing confounders **in expectation**; it does not guarantee identical finite groups, perfect implementation, absence of attrition or generalization to every population. A source's simplified explanation is not copied into an unconditional causal claim.

Percentages, rates and formula examples are mathematical derivations from explicitly stated original models. Financial amounts/rates are hypothetical and exclude unstated fees, taxes or transactions. A correct calculation does not guarantee an actual financial outcome. No professional advice, licensure rule or approved training is offered.

## Unavailable alternative sources

Two attempted NIST e-Handbook URLs returned HTTP 403:

- https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm
- https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm

They are not marked verified and the course does not rely on their contents. The accessible first-party textbook sections above support the stated formal scope. Earlier NCCER, ASE and official ASVAB reference failures remain recorded separately; no new verification of those requirements is claimed here.

## Review limits

Every new course/question has an author-review history, stable ID, content/question revision and skill/source metadata. No independent subject expert has reviewed this course. The 84 modeled questions have an additional exact-arithmetic/printed-choice audit in `tools/verify_college_math.py`; interpretation and the other 28 items remain outside that mathematical guarantee.

A successful HTTP response alone never sets a substantive verification date. Future changes to instruction, answer meanings or source claims need review and an appropriate revision. The linked books retain their publishers' rights; their text, illustrations and exercises are not bundled as new course content.
