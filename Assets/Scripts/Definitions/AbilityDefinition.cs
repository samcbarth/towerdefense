using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Ability Definition")]
    public sealed class AbilityDefinition : ScriptableObject
    {
        public string id = "ability_id";
        public string displayName = "Ability";
        public float cooldown = 10f;
        public float radius = 1f;
        public float damage = 0f;
        public float baseRepair = 0f;
        public StatusEffectDefinition effect;
        public GameObject visualPrefab;
        public AudioClip audioCue;
    }
}

