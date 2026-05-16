using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Wave Definition")]
    public sealed class WaveDefinition : ScriptableObject
    {
        public string id = "wave_id";
        public int reward = 100;
        public string warningText = "Incoming wave";
        public WaveGroup[] groups;
    }

    [System.Serializable]
    public struct WaveGroup
    {
        public EnemyDefinition enemy;
        public int count;
        public float spawnGap;
        public float startDelay;
    }
}

