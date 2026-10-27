using UnityEngine;

namespace RpgGame
{
    [CreateAssetMenu(menuName = "RPG/Achievement")]
    public class AchievementData : ScriptableObject
    {
        public string id = "first_victory";
        public string displayName = "First Victory";
        [TextArea] public string description = "Win a battle.";
        [Tooltip("Counter key from GameEvents (e.g. battles_won, enemies_defeated, gear_equipped, raids_won).")]
        public string counterKey = "battles_won";
        [Min(1)] public int target = 1;
    }
}
