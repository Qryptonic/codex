// Procedural3DPigGeneratorV4.cs
using UnityEngine;
using System.Collections;

[ExecuteAlways]
public class Procedural3DPigGeneratorV4 : MonoBehaviour {
    [Header("Body Parts Settings")]
    public float bodyRadius      = 0.5f;
    public float headRadius      = 0.35f;
    public float earRadius       = 0.15f;
    public float legRadius       = 0.12f;
    public float legHeight       = 0.2f;
    public float eyeRadius       = 0.05f;
    public float noseRadius      = 0.08f;

    [Header("Materials (assign in Inspector)")]
    public Material bodyMaterial;
    public Material accentMaterial;
    public Material eyeMaterial;

    [Header("Cuteness Effects")]
    [Tooltip("Heartbeat particle effect prefab")]  
    public ParticleSystem heartParticlePrefab;

    [Header("Animation Settings")]
    public float breathAmplitude = 0.05f;
    public float breathSpeed     = 1f;
    public float blinkIntervalMin= 3f;
    public float blinkIntervalMax= 8f;
    public float earTwitchAngle  = 15f;
    public float earTwitchSpeed  = 0.1f;
    public float tailWagAngle    = 20f;
    public float tailWagSpeed    = 2f;
    public float heartSpawnChance= 0.02f; // per second

    private Transform body, head, leftEar, rightEar, tail, nose;
    private Transform[] eyes;

    void OnValidate() {
        if (!bodyMaterial || !accentMaterial || !eyeMaterial)
            Debug.LogWarning("[PigV4] Missing material(s)", this);
        if (heartParticlePrefab == null)
            Debug.LogWarning("[PigV4] Heart particle prefab not assigned", this);
    }

    void Start() {
        BuildPig();
        StartCoroutine(Breathing());
        StartCoroutine(BlinkRoutine());
        StartCoroutine(EarTwitchRoutine());
        StartCoroutine(TailWagRoutine());
        StartCoroutine(HeartSpawnRoutine());
    }

    void BuildPig() {
        // Clean old
        foreach(var c in transform) DestroyImmediate(((Transform)c).gameObject);

        // Body
        body = CreatePart("Body", PrimitiveType.Sphere, bodyRadius, Vector3.zero, bodyMaterial);
        // Head
        head = CreatePart("Head", PrimitiveType.Sphere, headRadius, new Vector3(0, bodyRadius + headRadius*0.6f, 0), bodyMaterial);
        head.SetParent(body, false);
        // Ears
        leftEar  = CreatePart("LeftEar",  PrimitiveType.Sphere, earRadius,  new Vector3(-headRadius*0.6f, headRadius*1.2f, 0), bodyMaterial).SetParent(head, false);
        rightEar = CreatePart("RightEar", PrimitiveType.Sphere, earRadius,  new Vector3( headRadius*0.6f, headRadius*1.2f, 0), bodyMaterial).SetParent(head, false);
        // Legs
        CreateLeg("FrontLeftLeg",  new Vector3(-bodyRadius*0.6f, -bodyRadius - legHeight*0.5f,  bodyRadius*0.4f));
        CreateLeg("FrontRightLeg", new Vector3( bodyRadius*0.6f, -bodyRadius - legHeight*0.5f,  bodyRadius*0.4f));
        CreateLeg("BackLeftLeg",   new Vector3(-bodyRadius*0.6f, -bodyRadius - legHeight*0.5f, -bodyRadius*0.4f));
        CreateLeg("BackRightLeg",  new Vector3( bodyRadius*0.6f, -bodyRadius - legHeight*0.5f, -bodyRadius*0.4f));
        // Eyes
        eyes = new Transform[2];
        eyes[0] = CreatePart("LeftEye",  PrimitiveType.Sphere, eyeRadius, new Vector3(-headRadius*0.3f, headRadius*0.2f, headRadius*0.8f), eyeMaterial).SetParent(head, false);
        eyes[1] = CreatePart("RightEye", PrimitiveType.Sphere, eyeRadius, new Vector3( headRadius*0.3f, headRadius*0.2f, headRadius*0.8f), eyeMaterial).SetParent(head, false);
        // Nose
        nose = CreatePart("Nose", PrimitiveType.Sphere, noseRadius, new Vector3(0, 0, headRadius*0.95f), accentMaterial).SetParent(head, false);
        // Blush
        CreatePart("LeftBlush",  PrimitiveType.Sphere, noseRadius*0.7f, new Vector3(-headRadius*0.4f, 0, headRadius*0.6f), accentMaterial).SetParent(head, false);
        CreatePart("RightBlush", PrimitiveType.Sphere, noseRadius*0.7f, new Vector3( headRadius*0.4f, 0, headRadius*0.6f), accentMaterial).SetParent(head, false);
        // Tail
        tail = GameObject.CreatePrimitive(PrimitiveType.Cylinder).transform;
        tail.name = "Tail";
        tail.SetParent(body, false);
        tail.localScale = new Vector3(0.08f, 0.4f, 0.08f);
        tail.localPosition = new Vector3(0, 0, -bodyRadius*1.1f);
        tail.localEulerAngles = new Vector3(45, 0, 0);
        tail.GetComponent<MeshRenderer>().material = bodyMaterial;
    }

    IEnumerator Breathing() {
        while(true) {
            float s = 1f + breathAmplitude*(Mathf.Sin(Time.time*breathSpeed)+1f)*0.5f;
            body.localScale = Vector3.one * s;
            yield return null;
        }
    }

    IEnumerator BlinkRoutine() {
        while(true) {
            yield return new WaitForSeconds(Random.Range(blinkIntervalMin, blinkIntervalMax));
            foreach(var e in eyes) e.localScale = new Vector3(1f, 0.1f, 1f);
            yield return new WaitForSeconds(0.1f);
            foreach(var e in eyes) e.localScale = Vector3.one;
        }
    }

    IEnumerator EarTwitchRoutine() {
        while(true) {
            yield return new WaitForSeconds(Random.Range(4f, 8f));
            leftEar.localEulerAngles += Vector3.forward*earTwitchAngle;
            rightEar.localEulerAngles -= Vector3.forward*earTwitchAngle;
            yield return new WaitForSeconds(earTwitchSpeed);
            leftEar.localEulerAngles -= Vector3.forward*earTwitchAngle;
            rightEar.localEulerAngles += Vector3.forward*earTwitchAngle;
        }
    }

    IEnumerator TailWagRoutine() {
        while(true) {
            float t = (Mathf.Sin(Time.time*tailWagSpeed)+1f)*0.5f;
            tail.localEulerAngles = Vector3.up * (t*tailWagAngle - tailWagAngle*0.5f + 45f);
            yield return null;
        }
    }

    IEnumerator HeartSpawnRoutine() {
        while(true) {
            yield return new WaitForSeconds(1f);
            if (Random.value < heartSpawnChance && heartParticlePrefab) {
                Instantiate(heartParticlePrefab, head.position + head.up*0.2f, Quaternion.identity);
            }
        }
    }

    Transform CreatePart(string name, PrimitiveType type, float radius, Vector3 localPos, Material mat) {
        var go = GameObject.CreatePrimitive(type);
        go.name = name;
        go.transform.SetParent(this.transform, false);
        go.transform.localPosition = localPos;
        go.transform.localScale = Vector3.one * radius*2f;
        go.GetComponent<MeshRenderer>().material = mat;
        return go.transform;
    }

    void CreateLeg(string name, Vector3 localPos) {
        var leg = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        leg.name = name;
        leg.transform.SetParent(this.transform, false);
        leg.transform.localScale = new Vector3(legRadius*2f, legHeight, legRadius*2f);
        leg.transform.localPosition = localPos;
        leg.GetComponent<MeshRenderer>().material = bodyMaterial;
    }
}