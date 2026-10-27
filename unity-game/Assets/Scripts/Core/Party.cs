using System.Collections.Generic;
using System.Linq;

namespace RpgGame
{
    /// <summary>A roster of owned units plus an active team sized by PartyType (4 or 6).</summary>
    public class Party
    {
        public readonly List<Unit> roster = new List<Unit>();
        readonly List<Unit> active = new List<Unit>();

        public PartyType type = PartyType.Standard;
        public IReadOnlyList<Unit> Active => active;
        public int MaxSize => (int)type;

        public void Clear()
        {
            roster.Clear();
            active.Clear();
        }

        public void AddToRoster(Unit u)
        {
            u.team = Team.Player;
            if (!roster.Contains(u)) roster.Add(u);
        }

        /// <summary>Switch between 4-person and 6-person teams; trims extras from the end.</summary>
        public void SetType(PartyType t)
        {
            type = t;
            while (active.Count > MaxSize) active.RemoveAt(active.Count - 1);
        }

        public bool TryAddToActive(Unit u)
        {
            if (!roster.Contains(u) || active.Contains(u) || active.Count >= MaxSize) return false;
            active.Add(u);
            return true;
        }

        public bool RemoveFromActive(Unit u) => active.Remove(u);

        public void AutoFill()
        {
            foreach (var u in roster.OrderByDescending(x => x.level))
                if (!TryAddToActive(u)) break;
        }
    }
}
