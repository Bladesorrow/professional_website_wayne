using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace RpgGame
{
    [System.Serializable]
    public class UnitSave
    {
        public string character;
        public int level, xp, hp, mp;
        public int row;
        public List<string> gear = new List<string>();
    }

    [System.Serializable]
    public class CounterSave
    {
        public string key;
        public int value;
    }

    [System.Serializable]
    public class QuestSave
    {
        public string id;
        public int status;
        public int baseline;
    }

    [System.Serializable]
    public class SaveData
    {
        public int partyType = (int)PartyType.Standard;
        public int gold;
        public List<QuestSave> quests = new List<QuestSave>();
        public List<UnitSave> roster = new List<UnitSave>();
        public List<string> active = new List<string>();
        public List<string> inventory = new List<string>();
        public List<CounterSave> counters = new List<CounterSave>();
    }

    /// <summary>JSON save/load. Characters and gear are stored by name and resolved through GameDatabase.</summary>
    public static class SaveSystem
    {
        public static string FilePath => Path.Combine(Application.persistentDataPath, "save.json");
        public static bool Exists => File.Exists(FilePath);

        public static SaveData Capture(Party party, Inventory inventory, QuestLog questLog)
        {
            var d = new SaveData { partyType = (int)party.type, gold = inventory.gold, quests = questLog.Export() };
            foreach (var u in party.roster)
            {
                var us = new UnitSave { character = u.data.displayName, level = u.level, xp = u.xp, hp = u.hp, mp = u.mp, row = (int)u.row };
                foreach (var g in u.gear.Values) us.gear.Add(g.displayName);
                d.roster.Add(us);
            }
            foreach (var u in party.Active) d.active.Add(u.data.displayName);
            foreach (var g in inventory.items) d.inventory.Add(g.displayName);
            foreach (var kv in GameEvents.All) d.counters.Add(new CounterSave { key = kv.Key, value = kv.Value });
            return d;
        }

        public static void Apply(SaveData d, GameDatabase db, Party party, Inventory inventory, QuestLog questLog)
        {
            party.Clear();
            foreach (var us in d.roster)
            {
                var data = db.GetCharacter(us.character);
                if (data == null) continue;
                var u = new Unit(data, us.level) { xp = us.xp, row = us.row == (int)Row.Back ? Row.Back : Row.Front };
                foreach (var gn in us.gear)
                {
                    var g = db.GetGear(gn);
                    if (g != null) u.Equip(g);
                }
                u.hp = Mathf.Clamp(us.hp, 1, u.Get(StatType.MaxHP));
                u.mp = Mathf.Clamp(us.mp, 0, u.Get(StatType.MaxMP));
                party.AddToRoster(u);
            }

            party.SetType(d.partyType == (int)PartyType.Raid ? PartyType.Raid : PartyType.Standard);
            foreach (var name in d.active)
            {
                var u = party.roster.Find(x => x.data.displayName == name);
                if (u != null) party.TryAddToActive(u);
            }
            if (party.Active.Count == 0) party.AutoFill();

            inventory.items.Clear();
            foreach (var gn in d.inventory)
            {
                var g = db.GetGear(gn);
                if (g != null) inventory.Add(g);
            }

            inventory.gold = d.gold;
            questLog.Import(d.quests);

            GameEvents.ResetAll();
            foreach (var c in d.counters) GameEvents.Set(c.key, c.value);
        }

        public static void Write(SaveData d) => File.WriteAllText(FilePath, JsonUtility.ToJson(d, true));

        public static SaveData Read() => Exists ? JsonUtility.FromJson<SaveData>(File.ReadAllText(FilePath)) : null;
    }
}
