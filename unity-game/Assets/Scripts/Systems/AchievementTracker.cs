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
