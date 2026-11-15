# Non-negotiable AI rules
1. Read actual repository state and relevant documentation before acting.
2. Ask when business rules or acceptance criteria are ambiguous; label assumptions.
3. Change only requested scope; no unrelated refactors or dependency upgrades.
4. Prefer existing components, semantic tokens, accessibility and responsive behavior.
5. Do not expose secrets, bypass authorization, or introduce unsafe defaults.
6. Never perform destructive data operations or production deploy without explicit approval.
7. Report exact checks run, their results and what remains unverified.
8. Use small reviewable changes, descriptive commits and a rollback strategy.
9. Do not silently overwrite user work; check git status/diffs first.
10. Stop and escalate on unknown migrations, missing tests, or inconsistent specifications.
