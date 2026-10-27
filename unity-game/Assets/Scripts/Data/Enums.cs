namespace RpgGame
{
    public enum StatType { MaxHP, MaxMP, Attack, Defense, Magic, Speed }

    public enum GearSlot { Weapon, Head, Body, Accessory }

    public enum Rarity { Common, Uncommon, Rare, Epic, Legendary }

    public enum Team { Player, Enemy }

    public enum SkillTarget { SingleEnemy, AllEnemies, SingleAlly, AllAllies, Self }

    public enum SkillKind { PhysicalDamage, MagicDamage, Heal, Guard }

    public enum StatusType { None, Poison, Guard }

    // Standard = 4 members (story/open world), Raid = 6 members.
    public enum PartyType { Standard = 4, Raid = 6 }
}
