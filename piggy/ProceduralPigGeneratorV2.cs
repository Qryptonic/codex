using UnityEngine;

[RequireComponent(typeof(SpriteRenderer))]
public class ProceduralPigGeneratorV2 : MonoBehaviour {
    [Header("Texture Settings")]
    public int textureSize = 512;
    
    [Header("Randomization Seed")]
    public int randomSeed = 0;

    private SpriteRenderer rend;

    void Awake() {
        rend = GetComponent<SpriteRenderer>();
        if (randomSeed != 0) Random.InitState(randomSeed);
        else Random.InitState(System.DateTime.Now.Millisecond);

        rend.sprite = GeneratePigSprite(textureSize);
    }

    Sprite GeneratePigSprite(int size) {
        var tex = new Texture2D(size, size, TextureFormat.ARGB32, false);
        Color clear = new Color(0, 0, 0, 0);
        for (int y=0; y<size; y++)
            for (int x=0; x<size; x++)
                tex.SetPixel(x,y, clear);

        // Choose palette
        Color bodyCol = RandomPastel();
        Color spotCol = new Color(1,1,1, Random.Range(0.1f,0.3f)); // soft white spots
        Color cheekCol = new Color(1f,0.6f,0.7f,0.5f);
        Color eyeCol = Color.black;

        float half = size/2f;
        float rx = size*0.4f, ry = size*0.3f;

        // Body with radial gradient
        for(int y=0;y<size;y++){
            for(int x=0;x<size;x++){
                float dx = (x-half)/rx, dy=(y-half)/ry;
                float d2 = dx*dx+dy*dy;
                if(d2<=1f){
                    float t = Mathf.Sqrt(d2);
                    // gradient: center lighter, edge original
                    Color c = Color.Lerp(Color.Lerp(bodyCol, Color.white, 0.3f), bodyCol, t);
                    tex.SetPixel(x,y,c);
                }
            }
        }
        // Spots
        int spots = Random.Range(3,6);
        for(int i=0;i<spots;i++){
            Vector2 center = new Vector2(
                half + Random.Range(-rx*0.5f, rx*0.5f),
                half + Random.Range(-ry*0.5f, ry*0.5f)
            );
            float sr = Random.Range(size*0.05f, size*0.12f);
            DrawCircle(tex, center, sr, spotCol);
        }
        // Ears (ellipses)
        DrawEllipse(tex, new Vector2(half - rx*0.6f, half + ry*0.9f),
                    size*0.2f, size*0.3f, bodyCol, tilt: Random.Range(-20f,20f));
        DrawEllipse(tex, new Vector2(half + rx*0.6f, half + ry*0.9f),
                    size*0.2f, size*0.3f, bodyCol, tilt: Random.Range(-20f,20f));
        // Eyes with sparkle
        DrawCircle(tex, new Vector2(half - rx*0.3f, half + ry*0.1f), size*0.07f, eyeCol);
        DrawCircle(tex, new Vector2(half + rx*0.3f, half + ry*0.1f), size*0.07f, eyeCol);
        DrawCircle(tex, new Vector2(half - rx*0.28f, half + ry*0.13f), size*0.02f, Color.white);
        DrawCircle(tex, new Vector2(half + rx*0.32f, half + ry*0.13f), size*0.02f, Color.white);
        // Blush
        DrawCircle(tex, new Vector2(half - rx*0.5f, half - ry*0.2f), size*0.09f, cheekCol);
        DrawCircle(tex, new Vector2(half + rx*0.5f, half - ry*0.2f), size*0.09f, cheekCol);
        // Mouth arc
        DrawArc(tex, new Vector2(half, half - ry*0.3f), size*0.18f, 200, 340, eyeCol);
        // Whiskers
        DrawWhiskers(tex, new Vector2(half, half - ry*0.25f), 5, size*0.15f, eyeCol);
        // Feet
        for(int i=-1;i<=1;i+=2){
            DrawCircle(tex, new Vector2(half + rx*0.3f*i, half - ry*0.8f), size*0.08f, bodyCol);
            DrawCircle(tex, new Vector2(half + rx*0.5f*i, half - ry*0.75f), size*0.07f, bodyCol);
        }
        // Tail curl
        DrawArc(tex, new Vector2(half - rx*1.1f, half - ry*0.4f), size*0.1f, 90, 270, bodyCol);

        tex.Apply();
        return Sprite.Create(tex, new Rect(0,0,size,size), new Vector2(0.5f,0.5f), size);
    }

    Color RandomPastel() {
        Color[] pals = {
            new Color(1f,0.972f,0.906f),
            new Color(0.811f,1f,0.898f),
            new Color(0.804f,0.906f,1f),
            new Color(1f,0.957f,0.709f)
        };
        return pals[Random.Range(0,pals.Length)];
    }

    void DrawCircle(Texture2D t, Vector2 c, float r, Color col) {
        int x0=(int)c.x, y0=(int)c.y, rad=(int)r;
        for(int y=-rad;y<=rad;y++)for(int x=-rad;x<=rad;x++){
            if(x*x+y*y<=r*r)t.SetPixel(x0+x,y0+y,col);
        }
    }
    void DrawEllipse(Texture2D t, Vector2 c, float rx, float ry, Color col, float tilt=0f) {
        float rad = Mathf.Deg2Rad * tilt;
        float cos= Mathf.Cos(rad), sin=Mathf.Sin(rad);
        int w=(int)(rx+1), h=(int)(ry+1), x0=(int)c.x, y0=(int)c.y;
        for(int y=-h;y<=h;y++)for(int x=-w;x<=w;x++){
            // rotate point back
            float xr = x*cos + y*sin, yr = -x*sin + y*cos;
            if((xr*xr)/(rx*rx)+(yr*yr)/(ry*ry)<=1f) t.SetPixel(x0+x,y0+y,col);
        }
    }
    void DrawArc(Texture2D t, Vector2 c, float r, int a0, int a1, Color col) {
        for(int a=a0;a<=a1;a++){
            float rad=a*Mathf.Deg2Rad;
            int x=(int)(c.x+Mathf.Cos(rad)*r);
            int y=(int)(c.y+Mathf.Sin(rad)*r);
            t.SetPixel(x,y,col);
        }
    }
    void DrawWhiskers(Texture2D t, Vector2 c, int count, float length, Color col) {
        for(int i=0;i<count;i++){
            float angle = Mathf.Lerp(-30,30,(float)i/(count-1))*Mathf.Deg2Rad;
            for(int d=1;d<length;d++){
                int x = (int)(c.x+Mathf.Cos(angle)*d);
                int y = (int)(c.y+Mathf.Sin(angle)*d);
                t.SetPixel(x,y,col);
            }
        }
    }
}