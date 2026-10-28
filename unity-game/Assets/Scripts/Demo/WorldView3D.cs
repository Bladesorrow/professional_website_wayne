using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    /// <summary>
    /// Small 3D open-world field. Walk with WASD / arrows; touching an encounter marker starts a battle.
    /// Orange markers are 4-person skirmishes, the large purple marker is a 6-person raid.
    /// </summary>
    public class WorldView3D : MonoBehaviour
    {
        public class Encounter
        {
            public string name;
            public bool raid;
            public Transform marker;
        }

        public enum NpcKind { Quest, Shop }

        public class Npc
        {
            public string name;
            public NpcKind kind;
            public Transform marker;
        }

        public readonly List<Encounter> encounters = new List<Encounter>();
        public readonly List<Npc> npcs = new List<Npc>();
        Transform player;
        Camera cam;
        float cooldown;
        GUIStyle labelStyle;
        static readonly Vector3 CamOffset = new Vector3(0f, 11f, -9f);

        public void Build(Camera c)
        {
            cam = c;

            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.transform.SetParent(transform);
            ground.transform.localScale = new Vector3(6f, 1f, 6f);
            Strip(ground, new Color(0.3f, 0.55f, 0.3f));

            var p = new GameObject("Player").transform;
            p.SetParent(transform);
            Part(p, PrimitiveType.Capsule, new Vector3(0f, 1f, 0f), new Vector3(0.9f, 1f, 0.9f), new Color(0.3f, 0.5f, 0.95f));
            Part(p, PrimitiveType.Sphere, new Vector3(0f, 2.15f, 0f), Vector3.one * 0.6f, new Color(0.95f, 0.85f, 0.7f));
            Part(p, PrimitiveType.Cube, new Vector3(0f, 1.3f, 0.5f), new Vector3(0.25f, 0.25f, 0.5f), new Color(0.15f, 0.2f, 0.4f));
            player = p;

            AddEncounter("Goblin Camp", new Vector3(10f, 0f, 8f), false);
            AddEncounter("Wolf Den", new Vector3(-12f, 0f, 10f), false);
            AddEncounter("Bandit Road", new Vector3(14f, 0f, -12f), false);
            AddEncounter("Troll King's Keep", new Vector3(-18f, 0f, -16f), true);
            AddNpc("Elder Mira", NpcKind.Quest, new Vector3(4f, 0f, -4f), new Color(0.9f, 0.85f, 0.3f));
            AddNpc("Bram the Smith", NpcKind.Shop, new Vector3(-5f, 0f, -3f), new Color(0.8f, 0.4f, 0.3f));
            ScatterTrees();
            SnapCamera();
        }

        void AddNpc(string n, NpcKind kind, Vector3 pos, Color color)
        {
            var t = new GameObject(n).transform;
            t.SetParent(transform);
            t.position = pos;
            Part(t, PrimitiveType.Capsule, new Vector3(0f, 1f, 0f), new Vector3(0.9f, 1f, 0.9f), color);
            Part(t, PrimitiveType.Sphere, new Vector3(0f, 2.15f, 0f), Vector3.one * 0.6f, new Color(0.95f, 0.85f, 0.7f));
            Part(t, PrimitiveType.Cube, new Vector3(0f, 3.0f, 0f), new Vector3(0.3f, 0.3f, 0.3f), new Color(1f, 0.9f, 0.2f));
            npcs.Add(new Npc { name = n, kind = kind, marker = t });
        }

        /// <summary>The NPC the player is close enough to talk to, if any.</summary>
        public Npc NearbyNpc()
        {
            foreach (var n in npcs)
                if (Vector3.Distance(player.position, n.marker.position) < 3f) return n;
            return null;
        }

        void AddEncounter(string n, Vector3 pos, bool raid)
        {
            var m = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            m.name = n;
            m.transform.SetParent(transform);
            m.transform.position = pos + Vector3.up * 1f;
            m.transform.localScale = Vector3.one * (raid ? 2.4f : 1.3f);
            Strip(m, raid ? new Color(0.6f, 0.2f, 0.85f) : new Color(1f, 0.55f, 0.1f));
            encounters.Add(new Encounter { name = n, raid = raid, marker = m.transform });
        }

        void ScatterTrees()
        {
            var rng = new System.Random(7);
            for (int i = 0; i < 40; i++)
            {
                var pos = new Vector3((float)(rng.NextDouble() * 54 - 27), 0f, (float)(rng.NextDouble() * 54 - 27));
                if (pos.magnitude < 6f) continue;
                bool nearEncounter = false;
                foreach (var e in encounters)
                    if (Vector3.Distance(pos, e.marker.position - Vector3.up) < 5f) nearEncounter = true;
                if (nearEncounter) continue;

                var t = new GameObject("Tree").transform;
                t.SetParent(transform);
                t.position = pos;
                Part(t, PrimitiveType.Cylinder, new Vector3(0f, 1.2f, 0f), new Vector3(0.4f, 1.2f, 0.4f), new Color(0.4f, 0.27f, 0.15f));
                Part(t, PrimitiveType.Sphere, new Vector3(0f, 3.2f, 0f), Vector3.one * 2.4f, new Color(0.15f, 0.45f, 0.2f));
            }
        }

        public void Show(bool on)
        {
            gameObject.SetActive(on);
            if (on) { cooldown = 1f; SnapCamera(); }
        }

        public void SnapCamera()
        {
            cam.transform.position = player.position + CamOffset;
            cam.transform.LookAt(player.position + Vector3.up);
        }

        /// <summary>Nudge the player away from an encounter so it doesn't immediately retrigger.</summary>
        public void PushBack(Encounter e)
        {
            var flat = player.position - (e.marker.position - Vector3.up);
            flat.y = 0f;
            if (flat.sqrMagnitude < 0.01f) flat = Vector3.back;
            player.position = e.marker.position - Vector3.up + flat.normalized * 4f;
        }

        /// <summary>Moves the player and camera. Returns an encounter if the player touched one.</summary>
        public Encounter Tick(float dt)
        {
            var dir = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
            if (dir.sqrMagnitude > 1f) dir.Normalize();
            var pos = player.position + dir * 6f * dt;
            pos.x = Mathf.Clamp(pos.x, -28f, 28f);
            pos.z = Mathf.Clamp(pos.z, -28f, 28f);
            player.position = pos;
            if (dir.sqrMagnitude > 0.01f)
                player.rotation = Quaternion.Slerp(player.rotation, Quaternion.LookRotation(dir), dt * 12f);

            cam.transform.position = Vector3.Lerp(cam.transform.position, player.position + CamOffset, dt * 5f);
            cam.transform.LookAt(player.position + Vector3.up);

            cooldown -= dt;
            Encounter hit = null;
            foreach (var e in encounters)
            {
                var basePos = e.marker.position;
                float bob = Mathf.Sin(Time.time * 2f + basePos.x) * 0.15f;
                e.marker.position = new Vector3(basePos.x, (e.raid ? 1.2f : 1f) + bob, basePos.z);
                float reach = e.raid ? 2.6f : 1.8f;
                var flat = player.position - new Vector3(basePos.x, 0f, basePos.z);
                if (cooldown <= 0f && flat.magnitude < reach) hit = e;
            }
            return hit;
        }

        void OnGUI()
        {
            if (cam == null) return;
            if (labelStyle == null)
                labelStyle = new GUIStyle(GUI.skin.label) { alignment = TextAnchor.MiddleCenter, fontSize = 14, fontStyle = FontStyle.Bold };
            foreach (var n in npcs)
            {
                var np = cam.WorldToScreenPoint(n.marker.position + Vector3.up * 3.6f);
                if (np.z <= 0f) continue;
                GUI.Label(new Rect(np.x - 90, Screen.height - np.y - 10, 180, 22), n.name + (n.kind == NpcKind.Shop ? "  [Shop]" : "  [Quests]"), labelStyle);
            }
            foreach (var e in encounters)
            {
                var sp = cam.WorldToScreenPoint(e.marker.position + Vector3.up * (e.raid ? 2.2f : 1.4f));
                if (sp.z <= 0f) continue;
                GUI.Label(new Rect(sp.x - 90, Screen.height - sp.y - 10, 180, 22), e.name + (e.raid ? "  [RAID - 6]" : "  [4]"), labelStyle);
            }
        }

        static void Part(Transform parent, PrimitiveType type, Vector3 localPos, Vector3 scale, Color color)
        {
            var go = GameObject.CreatePrimitive(type);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = scale;
            Strip(go, color);
        }

        static void Strip(GameObject go, Color color)
        {
            var col = go.GetComponent<Collider>();
            if (col != null) Destroy(col);
            go.GetComponent<Renderer>().material.color = color;
        }
    }
}
