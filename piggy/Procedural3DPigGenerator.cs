// Procedural3DPigGenerator.cs
using UnityEngine;
using System.Collections;

[ExecuteAlways]
public class Procedural3DPigGenerator : MonoBehaviour {
    [Header("Body Parts Settings")]
    public float bodyRadius = 0.5f;
    public float headRadius = 0.35f;
    public float earRadius = 0.15f;
    public float legRadius = 0.12f;
    public float legHeight = 0.2f;
    public float eyeRadius = 0.05f;
    public float noseRadius = 0.08f;

    [Header("Materials")]
    public Material bodyMaterial;   // assign a pastel toon material
    public Material accentMaterial; // assign for blush/nose etc.
    public Material eyeMaterial;    // black

    [Header("Animation")]
    public float breathAmplitude = 0.05f;
    public float breathSpeed = 1f;

    private Transform body;

    void Start() {
        BuildPig();
        // start breathing
        StartCoroutine(BreathingRoutine());
    }

    void BuildPig() {
        // Clean up old
        foreach (Transform child in transform) DestroyImmediate(child.gameObject);

        // Body
        body = CreatePart("Body", PrimitiveType.Sphere, bodyRadius, Vector3.zero, bodyMaterial);

        // Head
        CreatePart("Head", PrimitiveType.Sphere, headRadius, new Vector3(0,  bodyRadius + headRadius*0.6f, 0), bodyMaterial);

        // Ears
        float earY = bodyRadius + headRadius*1.2f;
        CreatePart("LeftEar",  PrimitiveType.Sphere, earRadius, new Vector3(-headRadius*0.6f, earY, 0), bodyMaterial);
        CreatePart("RightEar", PrimitiveType.Sphere, earRadius, new Vector3( headRadius*0.6f, earY, 0), bodyMaterial);

        // Legs (4)
        float legY = -bodyRadius - legHeight*0.5f;
        float legX = bodyRadius*0.6f;
        float legZ = bodyRadius*0.4f;
        CreateLeg("FrontLeftLeg",  new Vector3(-legX, legY,  legZ));
        CreateLeg("FrontRightLeg", new Vector3( legX, legY,  legZ));
        CreateLeg("BackLeftLeg",   new Vector3(-legX, legY, -legZ));
        CreateLeg("BackRightLeg",  new Vector3( legX, legY, -legZ));

        // Eyes
        float eyeY = bodyRadius + headRadius*0.6f;
        float eyeZ = headRadius*0.8f;
        CreatePart("LeftEye",  PrimitiveType.Sphere, eyeRadius, new Vector3(-headRadius*0.3f, eyeY,  eyeZ), eyeMaterial);
        CreatePart("RightEye", PrimitiveType.Sphere, eyeRadius, new Vector3( headRadius*0.3f, eyeY,  eyeZ), eyeMaterial);

        // Nose / Blush
        CreatePart("Nose", PrimitiveType.Sphere, noseRadius, new Vector3(0, bodyRadius + headRadius*0.4f, headRadius*0.95f), accentMaterial);
        CreatePart("LeftBlush",  PrimitiveType.Sphere, noseRadius*0.7f, new Vector3(-headRadius*0.4f, bodyRadius + headRadius*0.2f, headRadius*0.6f), accentMaterial);
        CreatePart("RightBlush", PrimitiveType.Sphere, noseRadius*0.7f, new Vector3( headRadius*0.4f, bodyRadius + headRadius*0.2f, headRadius*0.6f), accentMaterial);

        // Tail (simple bent cylinder)
        var tail = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        tail.name = "Tail";
        tail.transform.SetParent(body, false);
        tail.transform.localScale = new Vector3(0.08f, 0.4f, 0.08f);
        tail.transform.localPosition = new Vector3(0, 0, -bodyRadius*1.1f);
        tail.transform.localEulerAngles = new Vector3(45, 0, 0);
        tail.GetComponent<MeshRenderer>().material = bodyMaterial;
    }

    Transform CreatePart(string name, PrimitiveType type, float radius, Vector3 localPos, Material mat) {
        var go = GameObject.CreatePrimitive(type);
        go.name = name;
        go.transform.SetParent(body, false);
        go.transform.localPosition = localPos;
        go.transform.localScale = Vector3.one * radius * 2f;
        go.GetComponent<MeshRenderer>().material = mat;
        return go.transform;
    }

    void CreateLeg(string name, Vector3 localPos) {
        var leg = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        leg.name = name;
        leg.transform.SetParent(body, false);
        leg.transform.localScale = new Vector3(legRadius*2f, legHeight, legRadius*2f);
        leg.transform.localPosition = localPos;
        leg.transform.localEulerAngles = Vector3.zero;
        leg.GetComponent<MeshRenderer>().material = bodyMaterial;
    }

    IEnumerator BreathingRoutine() {
        while (true) {
            float t = (Mathf.Sin(Time.time * breathSpeed) + 1f) * 0.5f;
            float scale = 1f + breathAmplitude * t;
            body.localScale = new Vector3(scale, scale, scale);
            yield return null;
        }
    }
}