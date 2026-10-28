using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    /// <summary>Builds all demo data at runtime (no asset files needed): characters, gear, loot, achievements.</summary>
    public class DemoContent
    {
        public readonly GameDatabase db = new GameDatabase();
        public readonly Party party = new Party();
        public readonly Inventory inventory = new Inventory();
        public readonly LootTable loot = new LootTable();
        public readonly QuestLog questLog = new QuestLog();
        public readonly List<GearData> shopStock = new List<GearData>();
        public readonly List<AchievementData> achievements = new List<AchievementData>();

        CharacterData goblin, wolf, troll;

        public DemoContent()
        {
            var strike = Skill("Strike", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f);
            var cleave = Skill("Cleave", SkillKind.PhysicalDamage, SkillTarget.AllEnemies, 0.7f, 6);
            var guard = Skill("Guard", SkillKind.Guard, SkillTarget.Self, 0f, 0);
            var fire = Skill("Fireball", SkillKind.MagicDamage, SkillTarget.SingleEnemy, 1.6f, 5);
            var heal = Skill("Heal", SkillKind.Heal, SkillTarget.SingleAlly, 1.5f, 4);
            var backstab = Skill("Backstab", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1.8f, 3);
            var venom = Skill("Venom Stab", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1.2f, 4, StatusType.Poison);
            var arrows = Skill("Arrow Rain", SkillKind.PhysicalDamage, SkillTarget.AllEnemies, 0.6f, 6);
            var song = Skill("Soothing Song", SkillKind.Heal, SkillTarget.AllAllies, 0.7f, 8);

            Reg(new Unit(Char("Aria", "Knight", 120, 20, 16, 8, 3, 8, strike, cleave, guard), 3));
            Reg(new Unit(Char("Brin", "Mage", 80, 40, 5, 4, 18, 9, strike, fire), 3));
            Reg(new Unit(Char("Cleo", "Cleric", 90, 40, 6, 5, 14, 7, strike, heal), 3));
            Reg(new Unit(Char("Dax", "Rogue", 85, 24, 15, 5, 4, 14, strike, backstab, venom), 3));
            Reg(new Unit(Char("Eli", "Ranger", 95, 24, 14, 6, 5, 11, strike, arrows), 2));
            Reg(new Unit(Char("Fenn", "Bard", 85, 30, 8, 5, 12, 10, strike, song), 2));
            foreach (var n in new[] { "Brin", "Cleo", "Fenn" }) party.roster.Find(x => x.Name == n).row = Row.Back;
            party.SetType(PartyType.Standard);
            party.AutoFill();

            var bite = Skill("Bite", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f);
            var fang = Skill("Venom Fang", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f, 4, StatusType.Poison);
            var slam = Skill("Ground Slam", SkillKind.PhysicalDamage, SkillTarget.AllEnemies, 0.6f, 8);
            goblin = Char("Goblin", "Enemy", 60, 10, 12, 4, 4, 9, Skill("Slash", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f));
            wolf = Char("Dire Wolf", "Enemy", 50, 20, 13, 3, 3, 13, bite, fang);
            troll = Char("Troll King", "Boss", 260, 30, 22, 6, 8, 6, Skill("Smash", SkillKind.PhysicalDamage, SkillTarget.SingleEnemy, 1f), slam);

            AddGear("Iron Sword", GearSlot.Weapon, Rarity.Uncommon, 60, V(StatType.Attack, 6));
            AddGear("Oak Staff", GearSlot.Weapon, Rarity.Uncommon, 60, V(StatType.Magic, 7));
            AddGear("Dragon Fang", GearSlot.Weapon, Rarity.Epic, 6, V(StatType.Attack, 12), V(StatType.Speed, 2));
            AddGear("Leather Cap", GearSlot.Head, Rarity.Common, 100, V(StatType.Defense, 2), V(StatType.MaxHP, 10));
            AddGear("Iron Helm", GearSlot.Head, Rarity.Uncommon, 50, V(StatType.Defense, 4));
            AddGear("Chain Vest", GearSlot.Body, Rarity.Uncommon, 50, V(StatType.Defense, 4), V(StatType.MaxHP, 20));
            AddGear("Plate Mail", GearSlot.Body, Rarity.Rare, 20, V(StatType.Defense, 7), V(StatType.MaxHP, 30));
            AddGear("Swift Ring", GearSlot.Accessory, Rarity.Rare, 20, V(StatType.Speed, 4));
            AddGear("Sage Amulet", GearSlot.Accessory, Rarity.Rare, 20, V(StatType.Magic, 6), V(StatType.MaxMP, 10));

            foreach (var n in new[] { "Iron Sword", "Oak Staff", "Leather Cap", "Chain Vest" }) inventory.Add(db.GetGear(n));

            foreach (var n in new[] { "Leather Cap", "Iron Helm", "Chain Vest", "Iron Sword", "Oak Staff", "Swift Ring", "Sage Amulet", "Plate Mail" })
                shopStock.Add(db.GetGear(n));

            questLog.quests.Add(new Quest
            {
                id = "clear_camps", title = "Clear the Roads", description = "Win 2 battles to make the roads safe.",
                counterKey = "battles_won", target = 2, rewardGold = 120, rewardItem = db.GetGear("Iron Helm"),
            });
            questLog.quests.Add(new Quest
            {
                id = "monster_hunt", title = "Monster Hunt", description = "Defeat 8 monsters.",
                counterKey = "enemies_defeated", target = 8, rewardGold = 200, rewardItem = db.GetGear("Swift Ring"),
            });
            questLog.quests.Add(new Quest
            {
                id = "raid_keep", title = "Topple the Troll King", description = "Clear the raid at Troll King's Keep with a team of 6.",
                counterKey = "raids_won", target = 1, rewardGold = 600, rewardItem = db.GetGear("Dragon Fang"),
            });

            achievements.Add(Ach("first_win", "First Victory", "battles_won", 1));
            achievements.Add(Ach("slayer", "Slayer (10 enemies)", "enemies_defeated", 10));
            achievements.Add(Ach("raider", "Raid Clear", "raids_won", 1));
            achievements.Add(Ach("treasure", "Treasure Hunter (5 drops)", "items_looted", 5));
            achievements.Add(Ach("equipped", "Well Equipped (equip 4)", "gear_equipped", 4));
        }

        /// <summary>4 enemies for open-world skirmishes, 6 (with a boss) for raid events.</summary>
        public List<Unit> MakeEnemies(bool raid, int level)
        {
            Unit E(CharacterData c, int lv) => new Unit(c, lv, Team.Enemy);
            if (!raid) return new List<Unit> { E(goblin, level), E(wolf, level), E(goblin, level), E(wolf, level) };
            return new List<Unit>
            {
                E(wolf, level), E(goblin, level), E(troll, level + 2), E(goblin, level), E(wolf, level), E(goblin, level)
            };
        }

        void Reg(Unit u)
        {
            db.Register(u.data);
            party.AddToRoster(u);
        }

        void AddGear(string n, GearSlot slot, Rarity r, float dropWeight, params StatValue[] b)
        {
            var g = ScriptableObject.CreateInstance<GearData>();
            g.displayName = n; g.slot = slot; g.rarity = r; g.bonuses = new List<StatValue>(b);
            db.Register(g);
            loot.Add(g, dropWeight);
        }

        static SkillData Skill(string n, SkillKind k, SkillTarget t, float power, int mp = 0, StatusType status = StatusType.None)
        {
            var s = ScriptableObject.CreateInstance<SkillData>();
            s.displayName = n; s.kind = k; s.target = t; s.power = power; s.mpCost = mp; s.status = status;
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

        static AchievementData Ach(string id, string name, string key, int target)
        {
            var a = ScriptableObject.CreateInstance<AchievementData>();
            a.id = id; a.displayName = name; a.counterKey = key; a.target = target;
            return a;
        }
    }
}
