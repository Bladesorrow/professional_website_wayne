using System;
using System.Collections.Generic;
using System.Linq;

namespace RpgGame
{
    public enum BattleState { Running, Won, Lost }

    /// <summary>
    /// Pure turn-based combat: units act one at a time in descending Speed order each round.
    /// Works for any team size, so 4v4 and 6v6 (raid) use the same code.
    /// </summary>
    public class Battle
    {
        public readonly List<Unit> players;
        public readonly List<Unit> enemies;
        readonly Queue<Unit> turnQueue = new Queue<Unit>();
        readonly Random rng;

        public Unit Current { get; private set; }
        public int Round { get; private set; }
        public BattleState State { get; private set; } = BattleState.Running;
        public event Action<string> Log;

        public Battle(IEnumerable<Unit> players, IEnumerable<Unit> enemies, int seed = 0)
        {
            this.players = players.ToList();
            this.enemies = enemies.ToList();
            foreach (var u in this.players) u.team = Team.Player;
            foreach (var u in this.enemies) u.team = Team.Enemy;
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

            Current.mp -= skill.mpCost;
            foreach (var t in targets) Apply(Current, t, skill);
            CheckEnd();
            if (State == BattleState.Running) AdvanceTurn();
            return true;
        }

        /// <summary>Simple AI: first skill we can afford, aimed at a random valid target.</summary>
        public void AutoAct()
        {
            if (State != BattleState.Running) return;
            var skill = Current.data.skills.LastOrDefault(s => s.mpCost <= Current.mp && s.kind != SkillKind.Heal)
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
                return;
            }

            bool magic = skill.kind == SkillKind.MagicDamage;
            int offense = actor.Get(magic ? StatType.Magic : StatType.Attack);
            int defense = magic ? target.Get(StatType.Magic) / 2 : target.Get(StatType.Defense);
            int variance = rng.Next(90, 111);
            int dmg = Math.Max(1, (int)Math.Round((offense * skill.power - defense) * variance / 100.0));
            target.TakeDamage(dmg);
            Log?.Invoke($"{actor.Name} uses {skill.displayName}: {target.Name} -{dmg} HP");
            if (!target.IsAlive)
            {
                Log?.Invoke($"{target.Name} is defeated!");
                if (target.team == Team.Enemy) GameEvents.Add("enemies_defeated");
            }
        }

        void CheckEnd()
        {
            if (!LivingOf(Team.Enemy).Any()) State = BattleState.Won;
            else if (!LivingOf(Team.Player).Any()) State = BattleState.Lost;
            if (State == BattleState.Won)
            {
                GameEvents.Add("battles_won");
                if (players.Count >= (int)PartyType.Raid) GameEvents.Add("raids_won");
            }
        }

        void AdvanceTurn()
        {
            while (true)
            {
                while (turnQueue.Count > 0)
                {
                    var next = turnQueue.Dequeue();
                    if (!next.IsAlive) continue;
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
