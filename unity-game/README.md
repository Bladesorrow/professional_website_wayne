# RPG Prototype (Unity)

Turn-based RPG foundation: gear, quests, shop, achievements, collectible characters, 4-person teams
(open world / story) and 6-person teams (raids).

## Run it
1. Open this folder in Unity Hub (Unity 6 / 6000.x; older LTS versions also work).
2. Create or open any scene, add an empty GameObject, attach `GameController`, press Play.
3. WASD/arrows to walk. Orange markers start a 4v4 skirmish, the big purple marker starts a 6v6 raid with a boss.
4. Tab opens the menu: party (roster, 4/6 team, front/back row), gear, quests, achievements, save/load.
5. Walk up to an NPC and press E: Elder Mira gives quests, Bram the Smith buys and sells gear.

Bosses enrage below 50% HP. Back-row units take 30% less physical damage and deal 20% less.

Uses the legacy Input Manager (`Input.GetAxis`); set *Active Input Handling* to *Both* if the project defaults to the new Input System.

## Layout (`Assets/Scripts`)
- `Data/` ScriptableObjects: `CharacterData`, `SkillData`, `GearData`, `AchievementData`. Create content via *Assets > Create > RPG*.
- `Core/` runtime state: `Unit` (level, XP, gear, status), `Party` (roster + active team of 4 or 6), `Inventory`, `GameDatabase`, `GameEvents` (counters).
- `Systems/` `Battle` (speed-ordered turns, poison/guard, XP and loot rewards), `LootTable`, `AchievementTracker`, `SaveSystem` (JSON).
- `Demo/` `GameController` (state machine + IMGUI menus), `WorldView3D` (field + encounters), `BattleView3D` (3D battle with primitives), `DemoContent` (all data built at runtime, no assets required).

## Next ideas
Real 3D models and animations, more status effects and elements, more NPCs and dialogue, boss telegraphs and adds, proper UI (UI Toolkit), data assets instead of runtime-built content.
