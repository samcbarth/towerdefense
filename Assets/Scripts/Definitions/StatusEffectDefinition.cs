using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Status Effect Definition")]
    public sealed class StatusEffectDefinition : ScriptableObject
    {
        public string id = "status_id";
        public string displayName = "Status Effect";
        public float duration = 1f;
        public float speedMultiplier = 1f;
        public float armorModifier = 0f;
        public bool breaksShield;
        public bool stacks;
    }
}

