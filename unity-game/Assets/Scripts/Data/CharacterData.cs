using System;
using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    [Serializable]
    public struct StatValue
    {
        public StatType stat;
        public int value;
    }

    [CreateAssetMenu(menuName = "RPG/Character")]
    public class CharacterData : ScriptableObject
    {
        public string displayName = "Hero";
        public string characterClass = "Fighter";
        public Sprite portrait;

        [Tooltip("Stats at level 1.")]
        public List<StatValue> baseStats = new List<StatValue>();
        [Tooltip("Stat gained per level.")]
        public List<StatValue> growth = new List<StatValue>();
        public List<SkillData> skills = new List<SkillData>();

        public int Base(StatType s) => Sum(baseStats, s);
        public int Growth(StatType s) => Sum(growth, s);

        static int Sum(List<StatValue> list, StatType s)
        {
            int total = 0;
            foreach (var v in list) if (v.stat == s) total += v.value;
            return total;
        }
    }
}
