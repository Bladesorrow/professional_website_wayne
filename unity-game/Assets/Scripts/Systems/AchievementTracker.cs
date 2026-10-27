using System;
using System.Collections.Generic;

namespace RpgGame
{
    public class AchievementTracker
    {
        readonly List<AchievementData> all;
        readonly HashSet<string> unlocked = new HashSet<string>();

        public event Action<AchievementData> Unlocked;

        public AchievementTracker(IEnumerable<AchievementData> achievements)
        {
            all = new List<AchievementData>(achievements);
            GameEvents.CounterChanged += OnCounter;
        }

        /// <summary>Marks achievements already satisfied by current counters as unlocked, without raising events.</summary>
        public void SyncFromCounters()
        {
            unlocked.Clear();
            foreach (var a in all) if (GameEvents.Get(a.counterKey) >= a.target) unlocked.Add(a.id);
        }

        public void Dispose() => GameEvents.CounterChanged -= OnCounter;

        public bool IsUnlocked(AchievementData a) => unlocked.Contains(a.id);

        public int Progress(AchievementData a) => Math.Min(a.target, GameEvents.Get(a.counterKey));

        void OnCounter(string key, int value)
        {
            foreach (var a in all)
            {
                if (a.counterKey != key || value < a.target || !unlocked.Add(a.id)) continue;
                Unlocked?.Invoke(a);
            }
        }
    }
}
