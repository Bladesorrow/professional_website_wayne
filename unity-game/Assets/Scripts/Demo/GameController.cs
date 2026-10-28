using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace RpgGame
{
    /// <summary>
    /// Entry point. Add this to an empty GameObject in any scene and press Play.
    /// Explore a 3D field (WASD), touch markers to fight, press Tab for party / gear / achievements / save.
    /// </summary>
    public class GameController : MonoBehaviour
    {
        enum Mode { Explore, Battle, Menu, Dialog }
        enum Tab { Party, Gear, Quests, Achievements, System }

        struct Toast { public string text; public float until; }

        DemoContent content;
        Party party;
        Inventory inventory;
        QuestLog questLog;
        WorldView3D.Npc currentNpc;
        AchievementTracker tracker;
        BattleView3D battleView;
        WorldView3D worldView;
        Camera cam;

        Mode mode = Mode.Explore;
        Tab tab = Tab.Party;
        Battle battle;
        WorldView3D.Encounter currentEncounter;
        SkillData pendingSkill;
        float enemyDelay;
        bool rewardsApplied;

        readonly List<string> log = new List<string>();
        readonly List<Toast> toasts = new List<Toast>();
        Vector2 logScroll, menuScroll;
        Unit selected;
        string systemMessage = "";

        void Start()
        {
            SetupCameraAndLight();
            GameEvents.ResetAll();
            content = new DemoContent();
            party = content.party;
            inventory = content.inventory;
            questLog = content.questLog;
            selected = party.roster[0];

            tracker = new AchievementTracker(content.achievements);
            tracker.Unlocked += a => Toast_("Achievement unlocked: " + a.displayName);

            worldView = new GameObject("World").AddComponent<WorldView3D>();
            worldView.Build(cam);
            battleView = new GameObject("BattleView").AddComponent<BattleView3D>();
            battleView.Init(cam);
        }

        void OnDestroy() => tracker?.Dispose();

        void SetupCameraAndLight()
        {
            cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.55f, 0.75f, 0.95f);

            if (FindObjectsByType<Light>(FindObjectsSortMode.None).Length == 0)
            {
                var l = new GameObject("Sun").AddComponent<Light>();
                l.type = LightType.Directional;
                l.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
            }
        }

        void Toast_(string text) => toasts.Add(new Toast { text = text, until = Time.time + 5f });

        // ---------- flow ----------
        void Update()
        {
            switch (mode)
            {
                case Mode.Explore:
                    var enc = worldView.Tick(Time.deltaTime);
                    if (enc != null) StartBattle(enc);
                    else if (Input.GetKeyDown(KeyCode.Tab)) mode = Mode.Menu;
                    else if (Input.GetKeyDown(KeyCode.E) && worldView.NearbyNpc() != null)
                    {
                        currentNpc = worldView.NearbyNpc();
                        mode = Mode.Dialog;
                    }
                    break;
                case Mode.Dialog:
                    if (Input.GetKeyDown(KeyCode.Escape)) mode = Mode.Explore;
                    break;
                case Mode.Menu:
                    if (Input.GetKeyDown(KeyCode.Tab) || Input.GetKeyDown(KeyCode.Escape)) mode = Mode.Explore;
                    break;
                case Mode.Battle:
                    if (battle.State == BattleState.Running && !battle.IsPlayerTurn)
                    {
                        enemyDelay += Time.deltaTime;
                        if (enemyDelay > 0.8f) { enemyDelay = 0f; battle.AutoAct(); }
                    }
                    else if (battle.State != BattleState.Running && !rewardsApplied) ApplyRewards();
                    break;
            }
        }

        void StartBattle(WorldView3D.Encounter enc)
        {
            currentEncounter = enc;
            party.SetType(enc.raid ? PartyType.Raid : PartyType.Standard);
            party.AutoFill();
            foreach (var u in party.Active) u.RestoreFull();

            int avg = Mathf.RoundToInt((float)party.Active.Average(u => u.level));
            battle = new Battle(party.Active, content.MakeEnemies(enc.raid, avg), 0, content.loot);
            log.Clear();
            log.Add($"{enc.name}: {battle.players.Count} vs {battle.enemies.Count}");
            battle.Log += s => { log.Add(s); logScroll.y = float.MaxValue; };

            pendingSkill = null;
            enemyDelay = 0f;
            rewardsApplied = false;
            worldView.Show(false);
            battleView.Begin(battle);
            mode = Mode.Battle;
        }

        void ApplyRewards()
        {
            rewardsApplied = true;
            if (battle.State != BattleState.Won) return;
            inventory.gold += battle.GoldReward;
            foreach (var d in battle.Drops) inventory.Add(d);
            if (battle.Drops.Count > 0) GameEvents.Add("items_looted", battle.Drops.Count);
        }

        void EndBattle()
        {
            battleView.End();
            foreach (var u in party.roster) u.RestoreFull();
            worldView.Show(true);
            worldView.PushBack(currentEncounter);
            battle = null;
            mode = Mode.Explore;
        }

        // ---------- UI ----------
        void OnGUI()
        {
            if (content == null) return;
            switch (mode)
            {
                case Mode.Explore: DrawExploreHud(); break;
                case Mode.Menu: DrawMenu(); break;
                case Mode.Dialog: DrawDialog(); break;
                case Mode.Battle: DrawBattleUI(); break;
            }
            DrawToasts();
        }

        void DrawToasts()
        {
            toasts.RemoveAll(t => Time.time > t.until);
            float y = 10f;
            foreach (var t in toasts)
            {
                GUI.Box(new Rect(Screen.width - 330, y, 320, 28), t.text);
                y += 32f;
            }
        }

        void DrawExploreHud()
        {
            GUI.Box(new Rect(10, 10, 430, 70),
                "WASD / arrows: move   |   E: talk to NPC   |   Tab: menu (party, gear, quests, save)\n" +
                "Orange marker = skirmish (4 heroes)   |   Purple marker = RAID (6 heroes)\n" +
                $"Team: {party.type} ({party.Active.Count}/{party.MaxSize})   Bag: {inventory.items.Count} items   Gold: {inventory.gold}");
            var near = worldView.NearbyNpc();
            if (near != null) GUI.Box(new Rect(Screen.width / 2f - 130, Screen.height - 60, 260, 30), $"[E] Talk to {near.name}");
        }

        void DrawBattleUI()
        {
            GUI.Box(new Rect(10, 10, 220, 28), $"Round {battle.Round}  -  {battle.State}");

            float h = 190f;
            var area = new Rect(10, Screen.height - h - 10, Screen.width - 20, h);
            GUILayout.BeginArea(area, GUI.skin.box);
            GUILayout.BeginHorizontal();

            GUILayout.BeginVertical(GUILayout.Width(area.width * 0.6f));
            if (battle.State == BattleState.Running)
            {
                if (battle.IsPlayerTurn) DrawPlayerActions();
                else GUILayout.Label($"{battle.Current.Name} is acting...");
            }
            else DrawBattleResult();
            GUILayout.EndVertical();

            logScroll = GUILayout.BeginScrollView(logScroll, GUI.skin.box);
            foreach (var l in log) GUILayout.Label(l);
            GUILayout.EndScrollView();

            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }

        void DrawPlayerActions()
        {
            var cur = battle.Current;
            GUILayout.Label($"{cur.Name} ({cur.data.characterClass})  HP {cur.hp}/{cur.Get(StatType.MaxHP)}  MP {cur.mp}/{cur.Get(StatType.MaxMP)}");

            if (pendingSkill == null)
            {
                GUILayout.Label("Choose a skill:");
                GUILayout.BeginHorizontal();
                foreach (var s in cur.data.skills)
                {
                    GUI.enabled = cur.mp >= s.mpCost;
                    if (GUILayout.Button($"{s.displayName}\n{(s.mpCost > 0 ? s.mpCost + " MP" : "free")}", GUILayout.Height(44)))
                    {
                        bool needsTarget = s.target == SkillTarget.SingleEnemy || s.target == SkillTarget.SingleAlly;
                        if (needsTarget) pendingSkill = s;
                        else battle.Act(s);
                    }
                    GUI.enabled = true;
                }
                GUILayout.EndHorizontal();
                return;
            }

            GUILayout.Label($"{pendingSkill.displayName}: choose a target");
            GUILayout.BeginHorizontal();
            foreach (var t in battle.ValidTargets(cur, pendingSkill).ToList())
            {
                if (GUILayout.Button($"{t.Name}\n{t.hp}/{t.Get(StatType.MaxHP)}", GUILayout.Height(44)))
                {
                    battle.Act(pendingSkill, t);
                    pendingSkill = null;
                    break;
                }
            }
            if (GUILayout.Button("Cancel", GUILayout.Height(44))) pendingSkill = null;
            GUILayout.EndHorizontal();
        }

        void DrawBattleResult()
        {
            if (battle.State == BattleState.Won)
            {
                GUILayout.Label($"VICTORY!  +{battle.XpReward} XP each, +{battle.GoldReward} gold");
                GUILayout.Label(battle.Drops.Count == 0 ? "No drops." : "Loot: " + string.Join(", ", battle.Drops.Select(d => d.displayName)));
            }
            else GUILayout.Label("DEFEAT... your party retreats to recover.");
            if (GUILayout.Button("Continue", GUILayout.Height(36))) EndBattle();
        }

        // ----- menu -----
        void DrawMenu()
        {
            var r = new Rect(Screen.width / 2f - 380, 40, 760, Mathf.Min(Screen.height - 80, 560));
            GUILayout.BeginArea(r, GUI.skin.box);
            GUILayout.BeginHorizontal();
            foreach (Tab t in System.Enum.GetValues(typeof(Tab)))
            {
                GUI.enabled = tab != t;
                if (GUILayout.Button(t.ToString(), GUILayout.Height(30))) { tab = t; menuScroll = Vector2.zero; }
                GUI.enabled = true;
            }
            if (GUILayout.Button("Close (Tab)", GUILayout.Height(30), GUILayout.Width(110))) mode = Mode.Explore;
            GUILayout.EndHorizontal();

            menuScroll = GUILayout.BeginScrollView(menuScroll);
            switch (tab)
            {
                case Tab.Party: DrawPartyTab(); break;
                case Tab.Gear: DrawGearTab(); break;
                case Tab.Quests: DrawQuestsTab(); break;
                case Tab.Achievements: DrawAchievementsTab(); break;
                case Tab.System: DrawSystemTab(); break;
            }
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        void DrawPartyTab()
        {
            GUILayout.Label($"Active team: {party.Active.Count}/{party.MaxSize}  ({party.type})   -   raids auto-switch to 6 when you touch the purple marker");
            GUILayout.Label("Back row: takes 30% less physical damage, deals 20% less physical damage.");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Standard team (4)")) party.SetType(PartyType.Standard);
            if (GUILayout.Button("Raid team (6)")) party.SetType(PartyType.Raid);
            GUILayout.EndHorizontal();

            foreach (var u in party.roster)
            {
                bool active = party.Active.Contains(u);
                GUILayout.BeginHorizontal(GUI.skin.box);
                GUILayout.Label($"{u.Name}  Lv{u.level}  {u.data.characterClass}   XP {u.xp}/{u.XpToNext}", GUILayout.Width(250));
                if (GUILayout.Button(u.row + " row", GUILayout.Width(80))) u.row = u.row == Row.Front ? Row.Back : Row.Front;
                GUILayout.Label(StatLine(u));
                if (GUILayout.Button(active ? "Remove" : "Add to team", GUILayout.Width(110)))
                {
                    if (active) party.RemoveFromActive(u);
                    else if (!party.TryAddToActive(u)) systemMessage = "Team is full.";
                }
                GUILayout.EndHorizontal();
            }
        }

        void DrawGearTab()
        {
            GUILayout.BeginHorizontal();
            foreach (var u in party.roster)
            {
                GUI.enabled = u != selected;
                if (GUILayout.Button(u.Name)) selected = u;
                GUI.enabled = true;
            }
            GUILayout.EndHorizontal();

            GUILayout.Label($"{selected.Name}  Lv{selected.level}   {StatLine(selected)}");
            foreach (GearSlot slot in System.Enum.GetValues(typeof(GearSlot)))
            {
                selected.gear.TryGetValue(slot, out var g);
                GUILayout.BeginHorizontal();
                GUILayout.Label($"{slot}: {(g == null ? "(empty)" : GearLabel(g))}", GUILayout.Width(520));
                GUI.enabled = g != null;
                if (GUILayout.Button("Unequip", GUILayout.Width(100))) inventory.Unequip(selected, slot);
                GUI.enabled = true;
                GUILayout.EndHorizontal();
            }

            GUILayout.Space(8);
            GUILayout.Label($"Bag ({inventory.items.Count})");
            foreach (var item in inventory.items.ToList())
            {
                GUILayout.BeginHorizontal();
                GUILayout.Label(GearLabel(item) + $"  [{item.slot}]", GUILayout.Width(520));
                if (GUILayout.Button("Equip", GUILayout.Width(100))) inventory.Equip(selected, item);
                GUILayout.EndHorizontal();
            }
        }

        void DrawQuestsTab()
        {
            bool any = false;
            foreach (var q in questLog.quests)
            {
                if (questLog.StatusOf(q) != QuestStatus.Active) continue;
                any = true;
                GUILayout.Label($"{q.title}  {questLog.Progress(q)}/{q.target}{(questLog.CanClaim(q) ? "  (ready - return to Elder Mira)" : "")}");
            }
            if (!any) GUILayout.Label("No active quests. Talk to Elder Mira (E).");
        }

        void DrawDialog()
        {
            var r = new Rect(Screen.width / 2f - 300, 60, 600, Mathf.Min(Screen.height - 120, 520));
            GUILayout.BeginArea(r, GUI.skin.box);
            GUILayout.Label($"{currentNpc.name}    Gold: {inventory.gold}");

            menuScroll = GUILayout.BeginScrollView(menuScroll);
            if (currentNpc.kind == WorldView3D.NpcKind.Quest) DrawQuestGiver();
            else DrawShop();
            GUILayout.EndScrollView();

            if (GUILayout.Button("Leave (Esc)", GUILayout.Height(30))) mode = Mode.Explore;
            GUILayout.EndArea();
        }

        void DrawQuestGiver()
        {
            GUILayout.Label("\"Brave travellers! Help the village and you shall be rewarded.\"");
            foreach (var q in questLog.quests)
            {
                var st = questLog.StatusOf(q);
                GUILayout.BeginVertical(GUI.skin.box);
                string reward = $"Reward: {q.rewardGold} gold" + (q.rewardItem != null ? $" + {q.rewardItem.displayName}" : "");
                GUILayout.Label($"{q.title}  -  {q.description}\n{reward}");
                if (st == QuestStatus.Available)
                {
                    if (GUILayout.Button("Accept")) questLog.Accept(q);
                }
                else if (st == QuestStatus.Active)
                {
                    GUILayout.Label($"Progress {questLog.Progress(q)}/{q.target}");
                    GUI.enabled = questLog.CanClaim(q);
                    if (GUILayout.Button("Claim reward") && questLog.Claim(q, inventory)) Toast_("Quest complete: " + q.title);
                    GUI.enabled = true;
                }
                else GUILayout.Label("Completed");
                GUILayout.EndVertical();
            }
        }

        void DrawShop()
        {
            GUILayout.Label("Buy");
            foreach (var g in content.shopStock)
            {
                GUILayout.BeginHorizontal();
                GUILayout.Label($"{GearLabel(g)}  [{g.slot}]", GUILayout.Width(430));
                GUI.enabled = inventory.gold >= Inventory.Price(g);
                if (GUILayout.Button($"Buy {Inventory.Price(g)}g", GUILayout.Width(100))) inventory.Buy(g);
                GUI.enabled = true;
                GUILayout.EndHorizontal();
            }
            GUILayout.Space(8);
            GUILayout.Label("Sell (half price)");
            foreach (var g in inventory.items.ToList())
            {
                GUILayout.BeginHorizontal();
                GUILayout.Label(GearLabel(g), GUILayout.Width(430));
                if (GUILayout.Button($"Sell {Inventory.Price(g) / 2}g", GUILayout.Width(100))) inventory.Sell(g);
                GUILayout.EndHorizontal();
            }
        }

        void DrawAchievementsTab()
        {
            foreach (var a in content.achievements)
            {
                bool done = tracker.IsUnlocked(a);
                GUILayout.Label($"[{(done ? "x" : " ")}] {a.displayName}   {tracker.Progress(a)}/{a.target}");
            }
        }

        void DrawSystemTab()
        {
            GUILayout.Label("Save file: " + SaveSystem.FilePath);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Save game", GUILayout.Height(34)))
            {
                SaveSystem.Write(SaveSystem.Capture(party, inventory, questLog));
                systemMessage = "Game saved.";
            }
            GUI.enabled = SaveSystem.Exists;
            if (GUILayout.Button("Load game", GUILayout.Height(34)))
            {
                SaveSystem.Apply(SaveSystem.Read(), content.db, party, inventory, questLog);
                tracker.SyncFromCounters();
                selected = party.roster.Count > 0 ? party.roster[0] : null;
                systemMessage = "Game loaded.";
            }
            GUI.enabled = true;
            GUILayout.EndHorizontal();
            GUILayout.Label(systemMessage);
        }

        static string StatLine(Unit u) =>
            $"HP {u.Get(StatType.MaxHP)}  MP {u.Get(StatType.MaxMP)}  ATK {u.Get(StatType.Attack)}  DEF {u.Get(StatType.Defense)}  MAG {u.Get(StatType.Magic)}  SPD {u.Get(StatType.Speed)}";

        static string GearLabel(GearData g) =>
            $"{g.displayName} ({g.rarity}): " + string.Join(", ", g.bonuses.Select(b => $"{b.stat} +{b.value}"));
    }
}
