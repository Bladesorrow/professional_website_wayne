using System.Collections.Generic;

namespace RpgGame
{
    public class Inventory
    {
        public readonly List<GearData> items = new List<GearData>();
        public int gold = 100;

        public static int Price(GearData g)
        {
            switch (g.rarity)
            {
                case Rarity.Common: return 40;
                case Rarity.Uncommon: return 100;
                case Rarity.Rare: return 300;
                case Rarity.Epic: return 900;
                default: return 2500;
            }
        }

        public bool Buy(GearData g)
        {
            if (gold < Price(g)) return false;
            gold -= Price(g);
            items.Add(g);
            return true;
        }

        public bool Sell(GearData g)
        {
            if (!items.Remove(g)) return false;
            gold += Price(g) / 2;
            return true;
        }

        public void Add(GearData item) => items.Add(item);

        /// <summary>Moves an item from the bag onto the unit; any replaced item returns to the bag.</summary>
        public bool Equip(Unit unit, GearData item)
        {
            if (!items.Remove(item)) return false;
            var old = unit.Equip(item);
            if (old != null) items.Add(old);
            GameEvents.Add("gear_equipped");
            return true;
        }

        public bool Unequip(Unit unit, GearSlot slot)
        {
            var old = unit.Unequip(slot);
            if (old == null) return false;
            items.Add(old);
            return true;
        }
    }
}
