using System;
using System.Collections.Generic;

namespace RpgGame
{
    public enum QuestStatus { Available, Active, Done }

    public class Quest
    {
        public string id;
        public string title;
        public string description;
        public string counterKey;
        public int target = 1;
        public int rewardGold;
        public GearData rewardItem;
    }

    /// <summary>Quests track a GameEvents counter relative to the value when the quest was accepted.</summary>
    public class QuestLog
    {
        public readonly List<Quest> quests = new List<Quest>();
        readonly Dictionary<string, QuestStatus> status = new Dictionary<string, QuestStatus>();
        readonly Dictionary<string, int> baseline = new Dictionary<string, int>();

        public QuestStatus StatusOf(Quest q) => status.TryGetValue(q.id, out var s) ? s : QuestStatus.Available;

        public void Accept(Quest q)
        {
            if (StatusOf(q) != QuestStatus.Available) return;
            status[q.id] = QuestStatus.Active;
            baseline[q.id] = GameEvents.Get(q.counterKey);
        }

        public int Progress(Quest q)
        {
            var s = StatusOf(q);
            if (s == QuestStatus.Done) return q.target;
            if (s == QuestStatus.Available) return 0;
            return Math.Max(0, Math.Min(q.target, GameEvents.Get(q.counterKey) - baseline[q.id]));
        }

        public bool CanClaim(Quest q) => StatusOf(q) == QuestStatus.Active && Progress(q) >= q.target;

        public bool Claim(Quest q, Inventory inventory)
        {
            if (!CanClaim(q)) return false;
            status[q.id] = QuestStatus.Done;
            inventory.gold += q.rewardGold;
            if (q.rewardItem != null) inventory.Add(q.rewardItem);
            return true;
        }

        public List<QuestSave> Export()
        {
            var list = new List<QuestSave>();
            foreach (var kv in status)
                list.Add(new QuestSave { id = kv.Key, status = (int)kv.Value, baseline = baseline.TryGetValue(kv.Key, out var b) ? b : 0 });
            return list;
        }

        public void Import(IEnumerable<QuestSave> saves)
        {
            status.Clear();
            baseline.Clear();
            foreach (var s in saves)
            {
                status[s.id] = (QuestStatus)s.status;
                baseline[s.id] = s.baseline;
            }
        }
    }
}
