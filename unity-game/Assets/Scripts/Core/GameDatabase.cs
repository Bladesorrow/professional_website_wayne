using System.Collections.Generic;

namespace RpgGame
{
    /// <summary>Name lookup for content, used to rebuild runtime objects from save files.</summary>
    public class GameDatabase
    {
        readonly Dictionary<string, CharacterData> characters = new Dictionary<string, CharacterData>();
        readonly Dictionary<string, GearData> gear = new Dictionary<string, GearData>();

        public void Register(CharacterData c) => characters[c.displayName] = c;
        public void Register(GearData g) => gear[g.displayName] = g;

        public CharacterData GetCharacter(string name) => characters.TryGetValue(name, out var c) ? c : null;
        public GearData GetGear(string name) => gear.TryGetValue(name, out var g) ? g : null;
    }
}
