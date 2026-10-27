using System;
using System.Collections.Generic;

namespace RpgGame
{
    /// <summary>Runtime instance of a character: level, gear, and current HP/MP.</summary>
    public class Unit
    {
        public readonly CharacterData data;
        public Team team;
        public int level;
        public int hp;
        public int mp;
        public int xp;
        public readonly Dictionary<StatusType, int> statuses = new Dictionary<StatusType, int>();
        public readonly Dictionary<GearSlot, GearData> gear = new Dictionary<GearSlot, GearData>();

        public Unit(CharacterData data, int level = 1, Team team = Team.Player)
        {
            this.data = data;
            this.level = Math.Max(1, level);
            this.team = team;
            hp = Get(StatType.MaxHP);
            mp = Get(StatType.MaxMP);
        }

        public string Name => data.displayName;
        public bool IsAlive => hp > 0;
        public int XpToNext => 40 + level * 20;

        public int Get(StatType s)
        {
            int v = data.Base(s) + data.Growth(s) * (level - 1);
            foreach (var g in gear.Values) v += g.Bonus(s);
            return v;
        }

        /// <summary>Equips an item, returning the item it replaced (or null).</summary>
        public GearData Equip(GearData item)
        {
            gear.TryGetValue(item.slot, out var old);
            gear[item.slot] = item;
            hp = Math.Min(hp, Get(StatType.MaxHP));
            mp = Math.Min(mp, Get(StatType.MaxMP));
            return old;
        }

        public GearData Unequip(GearSlot slot)
        {
            if (!gear.TryGetValue(slot, out var old)) return null;
            gear.Remove(slot);
            hp = Math.Min(hp, Get(StatType.MaxHP));
            mp = Math.Min(mp, Get(StatType.MaxMP));
            return old;
        }

        /// <summary>Adds XP and returns the number of levels gained.</summary>
        public int AddXp(int amount)
        {
            xp += Math.Max(0, amount);
            int gained = 0;
            while (xp >= XpToNext) { xp -= XpToNext; level++; gained++; }
            return gained;
        }

        public void TakeDamage(int amount) => hp = Math.Max(0, hp - Math.Max(0, amount));

        public void Heal(int amount) => hp = Math.Min(Get(StatType.MaxHP), hp + Math.Max(0, amount));

        public void RestoreFull()
        {
            hp = Get(StatType.MaxHP);
            mp = Get(StatType.MaxMP);
        }
    }
}
