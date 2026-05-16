using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Enemy Definition")]
    public sealed class EnemyDefinition : ScriptableObject
    {
        public string id = "enemy_id";
        public string displayName = "Enemy";
        public float health = 100f;
        public float armor = 0f;
        public float speed = 1f;
        public int reward = 10;
        public string[] tags;
        public GameObject visualPrefab;
    }
}

