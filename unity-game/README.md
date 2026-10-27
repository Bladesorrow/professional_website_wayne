# RPG Prototype (Unity)

Turn-based RPG foundation: gear, achievements, collectible characters, 4-person teams
(open world / story) and 6-person teams (raids).

## Run it
1. Open this folder in Unity Hub (Unity 6 / 6000.x; older LTS versions also work).
2. Create or open any scene, add an empty GameObject, attach `DemoBattle`, press Play.
3. Use the *Standard Team (4)* / *Raid Team (6)* buttons to switch modes.

## Layout (`Assets/Scripts`)
- `Data/` ScriptableObjects: `CharacterData`, `SkillData`, `GearData`, `AchievementData`. Create content via *Assets > Create > RPG*.
- `Core/` runtime state: `Unit` (level, gear, HP/MP), `Party` (roster + active team of 4 or 6), `GameEvents` (counters).
- `Systems/` `Battle` (speed-ordered turn combat, any team size) and `AchievementTracker` (unlocks from counters).
- `Demo/` `DemoBattle`: IMGUI playable prototype, no assets required.

## Next ideas
Inventory and loot drops, save/load (JSON), proper UI (uGUI/UI Toolkit), status effects and elements,
formation/roles for raids, open-world map and events, boss encounters.
