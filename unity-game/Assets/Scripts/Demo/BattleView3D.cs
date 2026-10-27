using System.Collections.Generic;
using UnityEngine;

namespace RpgGame
{
    /// <summary>
    /// 3D presentation of a Battle using primitive shapes: units stand in two lines facing each other,
    /// lunge when attacking, flash when hit, fall when defeated. HP bars and damage numbers are drawn with IMGUI.
    /// </summary>
    public class BattleView3D : MonoBehaviour
    {
        class Model
        {
            public Unit unit;
            public Transform root;
            public Renderer[] rends;
            public Color[] baseColors;
            public Vector3 home;
            public Quaternion homeRot;
            public Vector3 lungeOffset;
            public float lungeT = -1f;
            public float flashT;
            public Color flashColor;
            public float deadK;
            public bool dying;
        }

        class FloatText
        {
            public Vector3 world;
            public string text;
            public Color color;
            public float t;
        }

        static readonly Dictionary<string, Color> classColors = new Dictionary<string, Color>
        {
            { "Knight", new Color(0.35f, 0.5f, 0.9f) }, { "Mage", new Color(0.6f, 0.35f, 0.9f) },
            { "Cleric", new Color(0.95f, 0.9f, 0.6f) }, { "Rogue", new Color(0.2f, 0.55f, 0.35f) },
            { "Ranger", new Color(0.45f, 0.8f, 0.3f) }, { "Bard", new Color(0.95f, 0.5f, 0.7f) },
            { "Enemy", new Color(0.75f, 0.35f, 0.25f) }, { "Boss", new Color(0.65f, 0.1f, 0.1f) },
        };

        readonly Dictionary<Unit, Model> models = new Dictionary<Unit, Model>();
        readonly List<FloatText> floats = new List<FloatText>();
        Battle battle;
        Camera cam;
        Transform turnMarker;
        GUIStyle labelStyle;

        public void Init(Camera c)
        {
            cam = c;
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "BattleFloor";
            floor.transform.SetParent(transform);
            floor.transform.localScale = new Vector3(30f, 0.4f, 20f);
            floor.transform.position = new Vector3(0f, -0.2f, 0f);
            Strip(floor, new Color(0.25f, 0.27f, 0.3f));

            var m = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            m.name = "TurnMarker";
            m.transform.SetParent(transform);
            m.transform.localScale = Vector3.one * 0.4f;
            Strip(m, new Color(1f, 0.85f, 0.2f));
            turnMarker = m.transform;
            gameObject.SetActive(false);
        }

        public void Begin(Battle b)
        {
            Clear();
            battle = b;
            gameObject.SetActive(true);
            Layout(b.players, -5f, 0f);
            Layout(b.enemies, 5f, 180f);
            b.Applied += OnApplied;
            b.Defeated += OnDefeated;
            cam.transform.position = new Vector3(0f, 8.5f, -15f);
            cam.transform.LookAt(new Vector3(0f, 1f, 2f));
        }

        public void End()
        {
            Clear();
            gameObject.SetActive(false);
        }

        void Clear()
        {
            if (battle != null) { battle.Applied -= OnApplied; battle.Defeated -= OnDefeated; battle = null; }
            foreach (var m in models.Values) if (m.root != null) Destroy(m.root.gameObject);
            models.Clear();
            floats.Clear();
        }

        void Layout(List<Unit> units, float z, float yaw)
        {
            float spacing = 2.1f;
            for (int i = 0; i < units.Count; i++)
            {
                float x = (i - (units.Count - 1) / 2f) * spacing;
                float depth = units.Count > 4 && i % 2 == 1 ? 1.4f : 0f;
                var pos = new Vector3(x, 0f, z + Mathf.Sign(z) * depth);
                models[units[i]] = BuildModel(units[i], pos, Quaternion.Euler(0f, yaw, 0f));
            }
        }

        Model BuildModel(Unit u, Vector3 pos, Quaternion rot)
        {
            var root = new GameObject(u.Name).transform;
            root.SetParent(transform);
            root.SetPositionAndRotation(pos, rot);
            float scale = u.data.characterClass == "Boss" ? 1.8f : 1f;
            root.localScale = Vector3.one * scale;

            classColors.TryGetValue(u.data.characterClass, out var c);
            if (c == default) c = u.team == Team.Player ? Color.cyan : Color.red;

            Part(root, PrimitiveType.Capsule, new Vector3(0f, 1f, 0f), new Vector3(0.9f, 1f, 0.9f), c);
            Part(root, PrimitiveType.Sphere, new Vector3(0f, 2.15f, 0f), Vector3.one * 0.6f, Color.Lerp(c, Color.white, 0.35f));
            Part(root, PrimitiveType.Cube, new Vector3(0f, 1.3f, 0.5f), new Vector3(0.25f, 0.25f, 0.5f), Color.Lerp(c, Color.black, 0.4f));

            var m = new Model { unit = u, root = root, home = pos, homeRot = rot };
            m.rends = root.GetComponentsInChildren<Renderer>();
            m.baseColors = new Color[m.rends.Length];
            for (int i = 0; i < m.rends.Length; i++) m.baseColors[i] = m.rends[i].material.color;
            return m;
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

        // ---------- battle events ----------
        void OnApplied(Unit actor, Unit target, SkillData skill, int amount)
        {
            if (!models.TryGetValue(target, out var tm)) return;
            var pos = tm.root.position + Vector3.up * 2.5f;

            if (skill == null) { Flash(tm, new Color(0.6f, 0.2f, 0.8f)); Float(pos, "-" + amount, new Color(0.8f, 0.5f, 1f)); return; }
            if (skill.kind == SkillKind.Heal) { Flash(tm, Color.green); Float(pos, "+" + amount, Color.green); return; }
            if (skill.kind == SkillKind.Guard) { Flash(tm, new Color(0.3f, 0.6f, 1f)); Float(pos, "Guard", new Color(0.5f, 0.8f, 1f)); return; }

            if (models.TryGetValue(actor, out var am) && am.lungeT < 0f)
            {
                var toward = tm.home - am.home;
                toward.y = 0f;
                float dist = Mathf.Max(0f, toward.magnitude - 1.8f);
                am.lungeOffset = toward.normalized * Mathf.Min(dist, 4.5f);
                am.lungeT = 0f;
            }
            Flash(tm, Color.red);
            Float(pos, "-" + amount, Color.white);
        }

        void OnDefeated(Unit u)
        {
            if (models.TryGetValue(u, out var m)) m.dying = true;
        }

        static void Flash(Model m, Color c)
        {
            m.flashColor = c;
            m.flashT = 1f;
        }

        void Float(Vector3 world, string text, Color color) =>
            floats.Add(new FloatText { world = world, text = text, color = color });

        // ---------- per-frame ----------
        void Update()
        {
            float dt = Time.deltaTime;
            foreach (var m in models.Values)
            {
                if (m.root == null) continue;
                var pos = m.home;
                if (m.lungeT >= 0f)
                {
                    m.lungeT += dt / 0.5f;
                    pos += m.lungeOffset * Mathf.Sin(Mathf.PI * Mathf.Min(m.lungeT, 1f));
                    if (m.lungeT >= 1f) m.lungeT = -1f;
                }
                if (m.flashT > 0f)
                {
                    m.flashT = Mathf.Max(0f, m.flashT - dt * 2.5f);
                    pos += new Vector3(Mathf.Sin(Time.time * 60f), 0f, 0f) * 0.08f * m.flashT;
                    for (int i = 0; i < m.rends.Length; i++)
                        m.rends[i].material.color = Color.Lerp(m.baseColors[i], m.flashColor, m.flashT);
                }
                m.deadK = Mathf.MoveTowards(m.deadK, m.dying ? 1f : 0f, dt * 2f);
                m.root.position = pos;
                m.root.rotation = m.homeRot * Quaternion.Euler(0f, 0f, m.deadK * 90f);
            }

            bool showMarker = battle != null && battle.State == BattleState.Running && battle.Current != null
                              && models.ContainsKey(battle.Current);
            turnMarker.gameObject.SetActive(showMarker);
            if (showMarker)
            {
                var m = models[battle.Current];
                float h = m.unit.data.characterClass == "Boss" ? 5.2f : 3.1f;
                turnMarker.position = m.home + Vector3.up * (h + Mathf.Sin(Time.time * 4f) * 0.15f);
            }

            for (int i = floats.Count - 1; i >= 0; i--)
            {
                floats[i].t += dt;
                if (floats[i].t > 1.2f) floats.RemoveAt(i);
            }
        }

        void OnGUI()
        {
            if (battle == null || cam == null) return;
            if (labelStyle == null)
                labelStyle = new GUIStyle(GUI.skin.label) { alignment = TextAnchor.MiddleCenter, fontSize = 14, fontStyle = FontStyle.Bold };

            foreach (var m in models.Values)
            {
                if (m.root == null || m.dying) continue;
                var sp = cam.WorldToScreenPoint(m.home + Vector3.up * (m.unit.data.characterClass == "Boss" ? 4.6f : 2.9f));
                if (sp.z <= 0f) continue;
                float x = sp.x, y = Screen.height - sp.y;
                float frac = Mathf.Clamp01(m.unit.hp / (float)m.unit.Get(StatType.MaxHP));

                GUI.color = Color.black;
                GUI.DrawTexture(new Rect(x - 31, y - 3, 62, 8), Texture2D.whiteTexture);
                GUI.color = Color.Lerp(Color.red, Color.green, frac);
                GUI.DrawTexture(new Rect(x - 30, y - 2, 60 * frac, 6), Texture2D.whiteTexture);
                GUI.color = Color.white;

                string tag = m.unit.statuses.ContainsKey(StatusType.Poison) ? " [PSN]" : "";
                if (m.unit.statuses.ContainsKey(StatusType.Guard)) tag += " [GRD]";
                GUI.Label(new Rect(x - 70, y - 24, 140, 20), m.unit.Name + tag, labelStyle);
            }

            foreach (var f in floats)
            {
                var sp = cam.WorldToScreenPoint(f.world + Vector3.up * f.t * 1.5f);
                if (sp.z <= 0f) continue;
                GUI.color = new Color(f.color.r, f.color.g, f.color.b, 1f - f.t / 1.2f);
                GUI.Label(new Rect(sp.x - 50, Screen.height - sp.y - 10, 100, 24), f.text, labelStyle);
            }
            GUI.color = Color.white;
        }
    }
}
