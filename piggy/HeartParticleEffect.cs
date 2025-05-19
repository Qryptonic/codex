using UnityEngine;

/// <summary>
/// Creates a heart particle effect to accompany the procedural 3D pig
/// Attach to a GameObject with a ParticleSystem component
/// </summary>
[RequireComponent(typeof(ParticleSystem))]
public class HeartParticleEffect : MonoBehaviour {
    [Header("Heart Settings")]
    [Tooltip("How long until this effect self-destructs")]
    public float lifetime = 2.0f;
    
    [Tooltip("Color gradient for hearts")]
    public Gradient heartColors;
    
    [Tooltip("How fast the hearts rise")]
    public float riseSpeed = 0.5f;
    
    private ParticleSystem heartParticles;
    
    void Awake() {
        heartParticles = GetComponent<ParticleSystem>();
        
        // If no gradient defined, create a default pink one
        if (heartColors.colorKeys.Length == 0) {
            GradientColorKey[] colorKeys = new GradientColorKey[2];
            colorKeys[0].color = new Color(1f, 0.5f, 0.6f);
            colorKeys[0].time = 0.0f;
            colorKeys[1].color = new Color(1f, 0.7f, 0.8f);
            colorKeys[1].time = 1.0f;
            
            GradientAlphaKey[] alphaKeys = new GradientAlphaKey[2];
            alphaKeys[0].alpha = 1.0f;
            alphaKeys[0].time = 0.0f;
            alphaKeys[1].alpha = 0.0f;
            alphaKeys[1].time = 1.0f;
            
            heartColors.SetKeys(colorKeys, alphaKeys);
        }
        
        ConfigureParticleSystem();
        Destroy(gameObject, lifetime);
    }
    
    void ConfigureParticleSystem() {
        var main = heartParticles.main;
        main.startLifetime = 1.5f;
        main.startSpeed = riseSpeed;
        main.startSize = 0.15f;
        main.startColor = heartColors;
        main.simulationSpace = ParticleSystemSimulationSpace.World;
        
        var emission = heartParticles.emission;
        emission.rateOverTime = 3f;
        
        var shape = heartParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Sphere;
        shape.radius = 0.1f;
        
        var colorOverLifetime = heartParticles.colorOverLifetime;
        colorOverLifetime.enabled = true;
        
        var sizeOverLifetime = heartParticles.sizeOverLifetime;
        sizeOverLifetime.enabled = true;
        sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1f, new AnimationCurve(
            new Keyframe(0f, 0.2f),
            new Keyframe(0.3f, 1f),
            new Keyframe(1f, 0.5f)
        ));
        
        var velocityOverLifetime = heartParticles.velocityOverLifetime;
        velocityOverLifetime.enabled = true;
        velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(0.1f, new AnimationCurve(
            new Keyframe(0f, 0f),
            new Keyframe(0.5f, 1f),
            new Keyframe(1f, 0f)
        ));
        
        var renderer = heartParticles.GetComponent<ParticleSystemRenderer>();
        renderer.renderMode = ParticleSystemRenderMode.Billboard;
        renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
        
        // If we have a heart texture, assign it
        Texture2D heartTexture = CreateHeartTexture();
        if (heartTexture != null) {
            renderer.material.mainTexture = heartTexture;
        }
    }
    
    Texture2D CreateHeartTexture() {
        int size = 64;
        Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
        texture.filterMode = FilterMode.Bilinear;
        
        Color transparent = new Color(0, 0, 0, 0);
        Color heartColor = Color.white;
        
        // Clear texture
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                texture.SetPixel(x, y, transparent);
            }
        }
        
        // Draw heart shape
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                float nx = x / (float)size * 2 - 1;
                float ny = y / (float)size * 2 - 1;
                
                // Heart formula
                float d = Mathf.Pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
                
                if (d <= 0) {
                    // Inside heart shape
                    texture.SetPixel(x, y, heartColor);
                }
            }
        }
        
        texture.Apply();
        return texture;
    }
}