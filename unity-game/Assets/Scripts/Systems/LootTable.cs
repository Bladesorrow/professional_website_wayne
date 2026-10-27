using System;
using System.Collections.Generic;
using System.Linq;

namespace RpgGame
{
    public class LootTable
    {
        public class Entry
        {
            public GearData gear;
            public float weight = 1f;
        }

        public readonly List<Entry> entries = new List<Entry>();
        public float dropChancePerEnemy = 0.35f;

        public void Add(GearData gear, float weight) => entries.Add(new Entry { gear = gear, weight = weight });

        public List<GearData> Roll(Random rng, int enemyCount)
        {
            var drops = new List<GearData>();
            float total = entries.Sum(e => e.weight);
            if (total <= 0f) return drops;
            for (int i = 0; i < enemyCount; i++)
            {
                if (rng.NextDouble() > dropChancePerEnemy) continue;
                double pick = rng.NextDouble() * total;
                foreach (var e in entries)
                {
                    pick -= e.weight;
                    if (pick <= 0) { drops.Add(e.gear); break; }
                }
            }
            return drops;
        }
    }
}
