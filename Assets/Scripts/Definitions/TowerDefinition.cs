using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Tower Definition")]
    public sealed class TowerDefinition : ScriptableObject
    {
        public string id = "tower_id";
        public string displayName = "Tower";
        public int cost = 100;
        public float range = 3f;
        public float fireRate = 1f;
        public float damage = 10f;
        public Vector2Int footprint = Vector2Int.one;
        public GameObject visualPrefab;
        public ProjectileDefinition projectile;
        public TowerUpgrade[] upgrades;
    }

    [System.Serializable]
    public struct TowerUpgrade
    {
        public int cost;
        public float rangeBonus;
        public float fireRateMultiplier;
        public float damageMultiplier;
        public GameObject visualPrefab;
    }
}

