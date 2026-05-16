using UnityEngine;

namespace IronGridDefense.Definitions
{
    [CreateAssetMenu(menuName = "Iron Grid/Map Definition")]
    public sealed class MapDefinition : ScriptableObject
    {
        public string id = "map_id";
        public Vector2Int gridSize = new Vector2Int(13, 9);
        public Vector2Int spawnCell = new Vector2Int(0, 4);
        public Vector2Int baseCell = new Vector2Int(12, 4);
        public Vector2Int[] blockedCells;
        public Vector2Int[] buildableCells;
    }
}

