using System.Collections.Generic;

namespace RpgGame
{
    public class Inventory
    {
        public readonly List<GearData> items = new List<GearData>();

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
