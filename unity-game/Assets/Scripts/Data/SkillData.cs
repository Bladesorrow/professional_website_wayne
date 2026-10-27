using UnityEngine;

namespace RpgGame
{
    [CreateAssetMenu(menuName = "RPG/Skill")]
    public class SkillData : ScriptableObject
    {
        public string displayName = "Attack";
        public SkillKind kind = SkillKind.PhysicalDamage;
        public SkillTarget target = SkillTarget.SingleEnemy;
        [Min(0)] public int mpCost;
        [Min(0f)] public float power = 1f;
    }
}
