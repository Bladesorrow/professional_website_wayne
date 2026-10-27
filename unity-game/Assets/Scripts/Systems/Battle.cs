using System;
using System.Collections.Generic;
using System.Linq;

namespace RpgGame
{
    public enum BattleState { Running, Won, Lost }

    /// <summary>
    /// Pure turn-based combat: units act one at a time in descending Speed order each round.
    /// Works for any team size, so 4v4 and 6v6 (raid) use the same code.
    /// Supports Poison (damage at turn start) and Guard (halves damage until the guarder's next turn).
    /// </summary>
    public class Battle
    {
        public readonly List<Unit> players;
        public readonly List<Unit> enemies;
        readonly Queue<Unit> turnQueue = new Queue<Unit>();
        readonly Random rng;
        readonly LootTable lootTable;

        public Unit Current { get; private set; }
        public int Round { get; private set; }
        public BattleState State { get; private set; } = BattleState.Running;

        // Filled in when the battle is won.
        public int XpReward { get; private set; }
        public List<GearData> Drops { get; } = new List<GearData>();

        public event Action<string> Log;
        /// <summary>actor, target, skill, amount. actor/skill are null for status ticks (poison).</summary>
        public event Action<Unit, Unit, SkillData, int> Applied;
        public event Action<Unit> Defeated;

        public Battle(IEnumerable<Unit> players, IEnumerable<Unit> enemies, int seed = 0, LootTable lootTable = null)
        {
            this.players = players.ToList();
            this.enemies = enemies.ToList();
            this.lootTable = lootTable;
            foreach (var u in this.players) { u.team = Team.Player; u.statuses.Clear(); }
            foreach (var u in this.enemies) { u.team = Team.Enemy; u.statuses.Clear(); }
            rng = seed == 0 ? new Random() : new Random(seed);
            AdvanceTurn();
        }

        public IEnumerable<Unit> AllUnits => players.Concat(enemies);
        public IEnumerable<Unit> LivingOf(Team t) => (t == Team.Player ? players : enemies).Where(u => u.IsAlive);
        public bool IsPlayerTurn => State == BattleState.Running && Current != null && Current.team == Team.Player;

        public IEnumerable<Unit> ValidTargets(Unit actor, SkillData skill)
        {
            var allies = LivingOf(actor.team);
            var foes = LivingOf(actor.team == Team.Player ? Team.Enemy : Team.Player);
            switch (skill.target)
            {
                case SkillTarget.SingleEnemy:
                case SkillTarget.AllEnemies: return foes;
                case SkillTarget.SingleAlly:
                case SkillTarget.AllAllies: return allies;
                default: return new[] { actor };
            }
        }

        /// <summary>Perform the current unit's action. For single-target skills pass a target; area skills ignore it.</summary>
        public bool Act(SkillData skill, Unit target = null)
        {
            if (State != BattleState.Running || Current == null) return false;
            if (Current.mp < skill.mpCost) return false;

            var pool = ValidTargets(Current, skill).ToList();
            List<Unit> targets;
            if (skill.target == SkillTarget.AllEnemies || skill.target == SkillTarget.AllAllies) targets = pool;
            else if (skill.target == SkillTarget.Self) targets = new List<Unit> { Current };
            else
            {
                if (target == null || !pool.Contains(target)) return false;
                targets = new List<Unit> { target };
            }

            var actor = Current;
            actor.mp -= skill.mpCost;
            foreach (var t in targets) Apply(actor, t, skill);
            CheckEnd();
            if (State == BattleState.Running) AdvanceTurn();
            return true;
        }

        /// <summary>Simple AI: strongest affordable offensive skill, aimed at a random valid target.</summary>
        public void AutoAct()
        {
            if (State != BattleState.Running) return;
            var skill = Current.data.skills.LastOrDefault(s => s.mpCost <= Current.mp && s.kind != SkillKind.Heal && s.kind != SkillKind.Guard)
                        ?? Current.data.skills.First();
            var pool = ValidTargets(Current, skill).ToList();
            Act(skill, pool[rng.Next(pool.Count)]);
        }

        void Apply(Unit actor, Unit target, SkillData skill)
        {
            if (skill.kind == SkillKind.Heal)
            {
                int amt = (int)Math.Round(actor.Get(StatType.Magic) * skill.power);
                target.Heal(amt);
                Log?.Invoke($"{actor.Name} uses {skill.displayName}: {target.Name} +{amt} HP");
                Applied?.Invoke(actor, target, skill, amt);
                return;
            }

            if (skill.kind == SkillKind.Guard)
            {
                target.statuses[StatusType.Guard] = 1;
                Log?.Invoke($"{actor.Name} uses {skill.displayName} and braces for impact");
                Applied?.Invoke(actor, target, skill, 0);
                return;
            }

            bool magic = skill.kind == SkillKind.MagicDamage;
            int offense = actor.Get(magic ? StatType.Magic : StatType.Attack);
            int defense = magic ? target.Get(StatType.Magic) / 2 : target.Get(StatType.Defense);
            int variance = rng.Next(90, 111);
            int dmg = Math.Max(1, (int)Math.Round((offense * skill.power - defense) * variance / 100.0));
            if (target.statuses.ContainsKey(StatusType.Guard)) dmg = Math.Max(1, dmg / 2);

            target.TakeDamage(dmg);
            Log?.Invoke($"{actor.Name} uses {skill.displayName}: {target.Name} -{dmg} HP");
            Applied?.Invoke(actor, target, skill, dmg);

            if (!target.IsAlive) { OnDefeated(target); return; }
            if (skill.status != StatusType.None)
            {
                target.statuses[skill.status] = skill.statusTurns;
                Log?.Invoke($"{target.Name} is afflicted with {skill.status}");
            }
        }

        void OnDefeated(Unit u)
        {
            u.statuses.Clear();
            Log?.Invoke($"{u.Name} is defeated!");
            Defeated?.Invoke(u);
            if (u.team == Team.Enemy) GameEvents.Add("enemies_defeated");
        }

        void CheckEnd()
        {
            if (State != BattleState.Running) return;
            if (!LivingOf(Team.Enemy).Any()) State = BattleState.Won;
            else if (!LivingOf(Team.Player).Any()) State = BattleState.Lost;
            if (State != BattleState.Won) return;

            XpReward = enemies.Sum(e => e.level * 25);
            foreach (var p in LivingOf(Team.Player))
            {
                int gained = p.AddXp(XpReward);
                if (gained > 0) Log?.Invoke($"{p.Name} reached level {p.level}!");
            }
            if (lootTable != null) Drops.AddRange(lootTable.Roll(rng, enemies.Count));
            Log?.Invoke($"Victory! +{XpReward} XP" + (Drops.Count > 0 ? $", {Drops.Count} item(s) dropped" : ""));

            GameEvents.Add("battles_won");
            if (players.Count >= (int)PartyType.Raid) GameEvents.Add("raids_won");
        }

        /// <summary>Start-of-turn effects. Returns false if the unit died and loses its turn.</summary>
        bool BeginTurn(Unit u)
        {
            u.statuses.Remove(StatusType.Guard);
            if (u.statuses.TryGetValue(StatusType.Poison, out int turns))
            {
                int dmg = Math.Max(1, u.Get(StatType.MaxHP) / 12);
                u.TakeDamage(dmg);
                Log?.Invoke($"{u.Name} takes {dmg} poison damage");
                Applied?.Invoke(null, u, null, dmg);
                if (--turns <= 0) u.statuses.Remove(StatusType.Poison);
                else u.statuses[StatusType.Poison] = turns;
                if (!u.IsAlive) { OnDefeated(u); return false; }
            }
            return true;
        }

        void AdvanceTurn()
        {
            while (true)
            {
                while (turnQueue.Count > 0)
                {
                    var next = turnQueue.Dequeue();
                    if (!next.IsAlive) continue;
                    if (!BeginTurn(next))
                    {
                        CheckEnd();
                        if (State != BattleState.Running) return;
                        continue;
                    }
                    Current = next;
                    return;
                }
                Round++;
                foreach (var u in AllUnits.Where(u => u.IsAlive).OrderByDescending(u => u.Get(StatType.Speed)))
                    turnQueue.Enqueue(u);
            }
        }
    }
}
