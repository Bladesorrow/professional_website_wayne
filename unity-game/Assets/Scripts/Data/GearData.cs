using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    [CreateAssetMenu(menuName = "RPG/Gear")]
    public class GearData : ScriptableObject
    {
        public string displayName = "Rusty Sword";
        public GearSlot slot = GearSlot.Weapon;
        public Rarity rarity = Rarity.Common;
        public Sprite icon;
        public List<StatValue> bonuses = new List<StatValue>();

        public int Bonus(StatType s)
        {
            int total = 0;
            foreach (var b in bonuses) if (b.stat == s) total += b.value;
            return total;
        }
    }
}
