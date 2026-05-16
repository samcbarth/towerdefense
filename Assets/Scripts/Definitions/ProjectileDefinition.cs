using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Projectile Definition")]
    public sealed class ProjectileDefinition : ScriptableObject
    {
        public string id = "projectile_id";
        public float speed = 12f;
        public float splashRadius = 0f;
        public bool homing = true;
        public bool pierces;
        public GameObject visualPrefab;
        public StatusEffectDefinition effect;
    }
}

