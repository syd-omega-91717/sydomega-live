"""Declarative registry for governed platform skills."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Skill:
    name: str
    purpose: str
    tool: str
    risk: str = "low"
    requires_approval: bool = False


class SkillRegistry:
    def __init__(self, skills: list[Skill] | None = None):
        self._skills = {s.name: s for s in (skills or [])}

    def register(self, skill: Skill) -> None:
        if not skill.name.strip() or not skill.tool.strip():
            raise ValueError("skill name and tool are required")
        self._skills[skill.name] = skill

    def get(self, name: str) -> Skill | None:
        return self._skills.get(name)

    def inventory(self) -> list[Skill]:
        return [self._skills[name] for name in sorted(self._skills)]
