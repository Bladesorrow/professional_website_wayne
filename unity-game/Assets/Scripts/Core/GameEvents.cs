using System;
using System.Collections.Generic;

namespace RpgGame
{
    /// <summary>Global counters that achievements watch. Keys are free-form strings.</summary>
    public static class GameEvents
    {
        static readonly Dictionary<string, int> counters = new Dictionary<string, int>();
        public static event Action<string, int> CounterChanged;

        public static int Get(string key) => counters.TryGetValue(key, out var v) ? v : 0;

        public static void Add(string key, int amount = 1)
        {
            counters[key] = Get(key) + amount;
            CounterChanged?.Invoke(key, counters[key]);
        }

        public static void ResetAll() => counters.Clear();
    }
}
