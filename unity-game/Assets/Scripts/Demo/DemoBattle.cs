using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    /// <summary>
    /// Playable prototype. Add this to an empty GameObject in any scene and press Play.
    /// Builds all data at runtime (no assets needed). Toggle Standard (4v4) / Raid (6v6).
    /// </summary>
    public class DemoBattle : MonoBehaviour
    {
        Party party;
        Battle battle;
        AchievementTracker achievements;
        List<AchievementData> allAchievements;
        readonly List<string> log = new List<string>();
        readonly List<string> toasts = new List<string>();
        SkillData selectedSkill;
        Vector2 logScroll;
        float enemyDelay;

        void Start()
        {
            GameEvents.ResetAll();
            BuildAchievements();
            BuildParty();
            StartBattle();
        }

        void OnDestroy() => achievements?.Dispose();

        // ---------- data ----------
        static SkillData Skill(string n, SkillKind k, SkillTarget t, float power, int mp = 0)
        {
            var s = ScriptableObject.CreateInstance<SkillData>();
            s.displayName = n; s.kind = k; s.target = t; s.power = power; s.mpCost = mp;
            return s;
        }

        static StatValue V(StatType t, int v) => new StatValue { stat = t, value = v };

        static CharacterData Char(string name, string cls, int hp, int mp, int atk, int def, int mag, int spd, params SkillData[] skills)
        {
            var c = ScriptableObject.CreateInstance<CharacterData>();
            c.displayName = name; c.characterClass = cls;
            c.baseStats = new List<StatValue> { V(StatType.MaxHP, hp), V(StatType.MaxMP, mp), V(StatType.Attack, atk), V(StatType.Defense, def), V(StatType.Magic, mag), V(StatType.Speed, spd) };
            c.growth = new List<StatValue> { V(StatType.MaxHP, hp / 8), V(StatType.MaxMP, 2), V(StatType.Attack, 2), V(StatType.Defense, 1), V(StatType.Magic, 2), V(StatType.Speed, 1) };
            c.skills = new List<SkillData>(skills);
            return c;
        }

        static GearData Gear(string n, GearSlot slot, Rarity r, params StatValue[] b)
        {
            var g = ScriptableObject.CreateInstance<GearData>();
            g.displayName = n; g.slot = slot; g.rarity = r; g.bonuses = new List<StatValue>(b);
            return g;
        }

        static AchievementData Ach(string id, string name, string key, int target)
        {
            var a = ScriptableObject.CreateInstance<AchievementData>();
            a.id = id; a.displayName = name; a.counterKey = key; a.target = target;
            return a;
        }

        void BuildAchievements()
        {
            allAchievements = new List<AchievementData>
            {
                Ach("first_win", "First Victory", "battles_won", 1),
                Ach("slayer", "Slayer (10 enemies)", "enemies_defeated", 10),
                Ach("raider", "Raid Clear", "raids_won", 1),
            };
            achievements = new AchievementTracker(allAchievements);
            achievements.Unlocked += a => toasts.Add("Achievement unlocked: " + a.displayName);
        }

        void BuildParty()
        {
            var strike = Skill("Strike", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f);
            var cleave = Skill("Cleave", SkillKind.PhysicalDamage, SkillTarget.AllEnemies, 0.7f, 6);
            var fire = Skill("Fireball", SkillKind.MagicDamage, SkillTarget.SingleEnemy, 1.6f, 5);
            var heal = Skill("Heal", SkillKind.Heal, SkillTarget.SingleAlly, 1.5f, 4);
            var backstab = Skill("Backstab", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1.8f, 3);

            party = new Party();
            party.AddToRoster(new Unit(Char("Aria", "Knight", 120, 20, 16, 8, 3, 8, strike, cleave), 3));
            party.AddToRoster(new Unit(Char("Brin", "Mage", 80, 40, 5, 4, 18, 9, strike, fire), 3));
            party.AddToRoster(new Unit(Char("Cleo", "Cleric", 90, 40, 6, 5, 14, 7, strike, heal), 3));
            party.AddToRoster(new Unit(Char("Dax", "Rogue", 85, 24, 15, 5, 4, 14, strike, backstab), 3));
            party.AddToRoster(new Unit(Char("Eli", "Ranger", 95, 24, 14, 6, 5, 11, strike, backstab), 2));
            party.AddToRoster(new Unit(Char("Fenn", "Bard", 85, 30, 8, 5, 12, 10, strike, heal), 2));

            // Gear demo: equip a sword and armor on the knight.
            var knight = party.roster[0];
            knight.Equip(Gear("Iron Sword", GearSlot.Weapon, Rarity.Uncommon, V(StatType.Attack, 6)));
            knight.Equip(Gear("Plate Mail", GearSlot.Body, Rarity.Rare, V(StatType.Defense, 5), V(StatType.MaxHP, 30)));
            knight.RestoreFull();
            GameEvents.Add("gear_equipped", 2);

            party.SetType(PartyType.Standard);
            party.AutoFill();
        }

        void StartBattle()
        {
            foreach (var u in party.Active) u.RestoreFull();
            var grunt = Char("Goblin", "Enemy", 70, 10, 12, 4, 4, 9, Skill("Slash", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f));
            var enemies = new List<Unit>();
            int count = party.MaxSize;
            for (int i = 0; i < count; i++) enemies.Add(new Unit(grunt, party.type == PartyType.Raid ? 4 : 2, Team.Enemy));

            battle = new Battle(party.Active, enemies);
            battle.Log += s => { log.Add(s); logScroll.y = float.MaxValue; };
            log.Clear();
            log.Add($"Battle start: {party.Active.Count} vs {enemies.Count}");
            selectedSkill = null;
        }

        // ---------- loop ----------
        void Update()
        {
            if (battle == null || battle.State != BattleState.Running || battle.IsPlayerTurn) return;
            enemyDelay += Time.deltaTime;
            if (enemyDelay > 0.6f) { enemyDelay = 0; battle.AutoAct(); }
        }

        // ---------- UI ----------
        void OnGUI()
        {
            if (battle == null) return;
            GUILayout.BeginArea(new Rect(10, 10, Screen.width - 20, Screen.height - 20));

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Standard Team (4)", GUILayout.Height(28))) { Rebuild(PartyType.Standard); }
            if (GUILayout.Button("Raid Team (6)", GUILayout.Height(28))) { Rebuild(PartyType.Raid); }
            GUILayout.EndHorizontal();

            GUILayout.Label($"Round {battle.Round} — {battle.State}");
            DrawTeam("Party", battle.players);
            DrawTeam("Enemies", battle.enemies);

            if (battle.State == BattleState.Running && battle.IsPlayerTurn) DrawActions();
            else if (battle.State != BattleState.Running)
            {
                if (GUILayout.Button("Fight Again", GUILayout.Height(30))) StartBattle();
            }
            else GUILayout.Label("Enemy turn...");

            logScroll = GUILayout.BeginScrollView(logScroll, GUILayout.Height(120));
            foreach (var l in log) GUILayout.Label(l);
            GUILayout.EndScrollView();

            GUILayout.Label("Achievements:");
            foreach (var a in allAchievements)
                GUILayout.Label($"  [{(achievements.IsUnlocked(a) ? "x" : " ")}] {a.displayName} {achievements.Progress(a)}/{a.target}");
            foreach (var t in toasts) GUILayout.Label(t);
            GUILayout.EndArea();
        }

        void Rebuild(PartyType t)
        {
            foreach (var u in new List<Unit>(party.Active)) party.RemoveFromActive(u);
            party.SetType(t);
            party.AutoFill();
            StartBattle();
        }

        void DrawTeam(string title, List<Unit> units)
        {
            GUILayout.Label(title);
            GUILayout.BeginHorizontal();
            foreach (var u in units)
            {
                string mark = u == battle.Current ? "> " : "";
                string label = $"{mark}{u.Name} Lv{u.level}\nHP {u.hp}/{u.Get(StatType.MaxHP)}  MP {u.mp}";
                bool targetable = selectedSkill != null && battle.IsPlayerTurn && System.Linq.Enumerable.Contains(battle.ValidTargets(battle.Current, selectedSkill), u);
                GUI.enabled = u.IsAlive && (selectedSkill == null || targetable);
                if (GUILayout.Button(label, GUILayout.Height(50)) && targetable)
                {
                    battle.Act(selectedSkill, u);
                    selectedSkill = null;
                }
                GUI.enabled = true;
            }
            GUILayout.EndHorizontal();
        }

        void DrawActions()
        {
            GUILayout.Label($"{battle.Current.Name}'s turn — choose a skill, then a target");
            GUILayout.BeginHorizontal();
            foreach (var s in battle.Current.data.skills)
            {
                GUI.enabled = battle.Current.mp >= s.mpCost;
                if (GUILayout.Button($"{s.displayName} ({s.mpCost} MP)", GUILayout.Height(30)))
                {
                    if (s.target == SkillTarget.AllEnemies || s.target == SkillTarget.AllAllies || s.target == SkillTarget.Self)
                    { battle.Act(s); selectedSkill = null; }
                    else selectedSkill = s;
                }
                GUI.enabled = true;
            }
            GUILayout.EndHorizontal();
        }
    }
}
