// ProceduralPigGenerator.cs
using UnityEngine;

/// <summary>
/// Procedurally generates a chibi guinea pig sprite at runtime using Texture2D.
/// Attach to an empty GameObject with a SpriteRenderer.
/// </summary>
[RequireComponent(typeof(SpriteRenderer))]
public class ProceduralPigGenerator : MonoBehaviour {
    [Header("Texture Settings")]
    [Tooltip("Resolution of the generated sprite (square)")]
    public int textureSize = 512;

    [Header("Randomization Seed")]
    [Tooltip("Use a constant seed for reproducibility, or leave at 0 for random")]
    public int randomSeed = 0;

    // Pastel palette for body colors
    private readonly Color[] pastelColors = new Color[] {
        new Color(1f, 0.972f, 0.906f), // Cream White
        new Color(0.811f, 1f, 0.898f), // Pastel Mint
        new Color(0.804f, 0.906f, 1f), // Baby Blue
        new Color(1f, 0.957f, 0.709f)  // Warm Yellow
    };

    private SpriteRenderer spriteRenderer;

    void Awake() {
        spriteRenderer = GetComponent<SpriteRenderer>();
        if (randomSeed != 0) Random.InitState(randomSeed);
        else Random.InitState(System.DateTime.Now.Millisecond);

        spriteRenderer.sprite = GeneratePigSprite(textureSize);
    }

    private Sprite GeneratePigSprite(int size) {
        var tex = new Texture2D(size, size, TextureFormat.ARGB32, false);
        var transparent = new Color(0, 0, 0, 0);
        // Clear background
        for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
                tex.SetPixel(x, y, transparent);

        // Choose colors
        Color bodyColor  = pastelColors[Random.Range(0, pastelColors.Length)];
        Color blushColor = pastelColors[Random.Range(0, pastelColors.Length)];
        blushColor.a = 0.6f;
        Color eyeColor   = Color.black;

        float half = size / 2f;
        float radiusX = size * 0.4f;
        float radiusY = size * 0.3f;

        // Body (ellipse)
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                float dx = (x - half) / radiusX;
                float dy = (y - half) / radiusY;
                if (dx*dx + dy*dy <= 1f) tex.SetPixel(x, y, bodyColor);
            }
        }

        // Ears
        float earR = size * Random.Range(0.15f, 0.22f);
        DrawCircle(tex, new Vector2(half - radiusX*0.6f, half + radiusY*0.8f), earR, bodyColor);
        DrawCircle(tex, new Vector2(half + radiusX*0.6f, half + radiusY*0.8f), earR, bodyColor);

        // Eyes + highlights
        float eyeR = size * 0.07f;
        DrawCircle(tex, new Vector2(half - radiusX*0.3f, half + radiusY*0.1f), eyeR, eyeColor);
        DrawCircle(tex, new Vector2(half + radiusX*0.3f, half + radiusY*0.1f), eyeR, eyeColor);
        DrawCircle(tex, new Vector2(half - radiusX*0.3f + eyeR*0.3f, half + radiusY*0.1f + eyeR*0.3f), eyeR*0.3f, Color.white);
        DrawCircle(tex, new Vector2(half + radiusX*0.3f + eyeR*0.3f, half + radiusY*0.1f + eyeR*0.3f), eyeR*0.3f, Color.white);

        // Blush
        float blushR = size * 0.09f;
        DrawCircle(tex, new Vector2(half - radiusX*0.5f, half - radiusY*0.2f), blushR, blushColor);
        DrawCircle(tex, new Vector2(half + radiusX*0.5f, half - radiusY*0.2f), blushR, blushColor);

        // Mouth (arc)
        DrawArc(tex, new Vector2(half, half - radiusY*0.3f), size * 0.18f, 200, 340, Color.black);

        tex.Apply();
        var rect = new Rect(0, 0, size, size);
        return Sprite.Create(tex, rect, new Vector2(0.5f, 0.5f), size);
    }

    private void DrawCircle(Texture2D tex, Vector2 center, float radius, Color col) {
        int x0 = Mathf.FloorToInt(center.x), y0 = Mathf.FloorToInt(center.y), r = Mathf.CeilToInt(radius);
        for (int dy = -r; dy <= r; dy++)
            for (int dx = -r; dx <= r; dx++)
                if (dx*dx + dy*dy <= radius*radius)
                    tex.SetPixel(x0 + dx, y0 + dy, col);
    }

    private void DrawArc(Texture2D tex, Vector2 center, float radius, int startDeg, int endDeg, Color col) {
        for (int d = startDeg; d <= endDeg; d++) {
            float rad = d * Mathf.Deg2Rad;
            int x = Mathf.RoundToInt(center.x + Mathf.Cos(rad) * radius);
            int y = Mathf.RoundToInt(center.y + Mathf.Sin(rad) * radius);
            tex.SetPixel(x, y, col);
        }
    }
}