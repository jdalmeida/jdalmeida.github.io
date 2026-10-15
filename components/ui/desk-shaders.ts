// GLSL for the desk scene. One warm lamp fixed in desk space (it belongs to the room, the camera is what moves),
// a hemisphere ambient, energy-normalised Blinn-Phong with Schlick Fresnel, and a filmic tone curve.
// Colours are sRGB in, approximated as gamma 2 (x² / sqrt), which is close enough and cheap.

const PRECISION = `#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
`;

const LIGHTING = `
uniform vec3 uLight; uniform vec3 uEye; uniform float uLightZ; uniform float uExposure; uniform float uGlint;
vec3 lampAt(vec3 p, out vec3 L) {
  L = uLight - p; float d2 = dot(L, L); L *= inversesqrt(d2);
  // Inverse-square falloff with a soft core, 1 directly under the lamp.
  return vec3(1., .82, .64) * 1.08 * uLightZ * uLightZ * 1.6 / (d2 + .6 * uLightZ * uLightZ);
}
vec3 sky(vec3 n) { return mix(vec3(.035, .03, .026), vec3(.1, .105, .115), n.z * .5 + .5); }
// View-independent part: what a light map can hold.
vec3 diffuse(vec3 p, vec3 n) { vec3 L; vec3 lamp = lampAt(p, L); return sky(n) + lamp * max(dot(n, L), 0.); }
// View-dependent part: the lamp's highlight and a grazing sheen of the room, scaled by uGlint (dimmed as the camera
// dives into the mug, where the lamp's reflection on the coffee would fill the screen).
vec3 specular(vec3 p, vec3 n, float spec, float gloss) {
  vec3 L; vec3 lamp = lampAt(p, L);
  vec3 V = normalize(uEye - p), H = normalize(L + V);
  float fres = .04 + .96 * pow(1. - max(dot(n, V), 0.), 5.);
  float s = spec * (gloss + 2.) / 8. * pow(max(dot(n, H), 0.), gloss) * (.7 + 3. * fres);
  return (lamp * s * max(dot(n, L), 0.) + sky(n) * fres * spec * .6) * uGlint;
}
vec3 shade(vec3 albedo, vec3 p, vec3 n, float spec, float gloss) { return albedo * diffuse(p, n) + specular(p, n, spec, gloss); }
vec3 tonemap(vec3 x) {
  x *= uExposure;
  x = clamp(x * (2.51 * x + .03) / (x * (2.43 * x + .59) + .14), 0., 1.);
  return sqrt(x);
}
`;

// Vertex-coloured solids: mug, legs, pencil, pen, plant, bin, paper balls.
export const SOLID = {
  vertex: `attribute vec3 position; attribute vec3 normal; attribute vec3 color; attribute vec2 mat;
    uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix;
    varying vec3 vColor; varying vec3 vNormal; varying vec3 vPos; varying vec2 vMat;
    void main() {
      vColor = color * color; vNormal = normal; vPos = position; vMat = mat;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    }`,
  fragment: `${PRECISION}${LIGHTING}
    uniform float uOpacity; varying vec3 vColor; varying vec3 vNormal; varying vec3 vPos; varying vec2 vMat;
    void main() {
      vec3 n = normalize(vNormal);
      if (!gl_FrontFacing) n = -n;
      gl_FragColor = vec4(tonemap(shade(vColor, vPos, n, vMat.x, vMat.y)), 1.) * uOpacity;
    }`,
};

// Textured surfaces. Mode 0 (tabletop edge, drawer fronts, sticky note): tMap is albedo with gloss in alpha, tDecal a
// premultiplied overlay, the grain bumps the normal, all lit live. Mode 1 (chalk): premultiplied texture, unlit, so the
// desk-wide transparent plane costs one read. Mode 2 (top, floor): tMap is a light map (LIGHTMAP below), so only the
// highlight is computed per pixel; uFade fades the plane out radially (the floor's edge into darkness).
export const SURFACE = {
  vertex: `attribute vec3 position; attribute vec3 normal; attribute vec2 uv; attribute vec3 color;
    uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix;
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos; varying vec3 vColor;
    void main() {
      vUv = uv; vNormal = normal; vPos = position; vColor = color;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    }`,
  fragment: `${PRECISION}${LIGHTING}
    uniform sampler2D tMap; uniform sampler2D tDecal; uniform vec2 uTexel; uniform float uBump;
    uniform float uSpec; uniform float uGloss; uniform float uMode; uniform float uFade; uniform float uOpacity;
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos; varying vec3 vColor;
    float lum(vec2 uv) { return dot(texture2D(tMap, uv).rgb, vec3(.3, .55, .15)); }
    void main() {
      vec4 base = texture2D(tMap, vUv);
      if (uMode > .5 && uMode < 1.5) { gl_FragColor = base * uOpacity; return; }
      vec3 n = normalize(vNormal);
      if (uMode > 1.5) {
        vec3 col = base.rgb * base.rgb;
        if (uSpec > 0.) col += specular(vPos, n, uSpec * base.a, uGloss);
        float a = uOpacity;
        if (uFade > 0.) a *= 1. - smoothstep(.42, .96, length((vUv - .5) * 2.));
        gl_FragColor = vec4(tonemap(col), 1.) * a;
        return;
      }
      vec4 decal = texture2D(tDecal, vUv);
      if (uBump > 0.) {
        // Grain relief from the albedo: dark latewood and pores sit lower, so the lamp's sheen breaks along them.
        float c = lum(vUv);
        vec2 g = vec2(lum(vUv + vec2(uTexel.x, 0.)) - c, lum(vUv + vec2(0., uTexel.y)) - c);
        n = normalize(n + vec3(-g * uBump, 0.));
      }
      vec3 albedo = base.rgb * (1. - decal.a) + decal.rgb;
      albedo *= albedo * vColor;
      vec3 col = tonemap(shade(albedo, vPos, n, uSpec * base.a * (1. - decal.a * .85), uGloss));
      gl_FragColor = vec4(col, 1.) * uOpacity;
    }`,
};

// Light map for a static horizontal surface, rendered once: albedo (wood + decals) times the lamp's diffuse light,
// with the grain's relief, stored as sqrt for precision in the darks. Alpha carries the gloss the highlight needs.
export const LIGHTMAP = {
  vertex: `attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }`,
  fragment: `${PRECISION}${LIGHTING}
    uniform sampler2D tMap; uniform sampler2D tDecal; uniform vec2 uTexel; uniform float uBump;
    uniform vec2 uOrigin; uniform vec2 uExtent; uniform float uZ; varying vec2 vUv;
    float lum(vec2 uv) { return dot(texture2D(tMap, uv).rgb, vec3(.3, .55, .15)); }
    void main() {
      vec4 base = texture2D(tMap, vUv), decal = texture2D(tDecal, vUv);
      float c = lum(vUv);
      vec2 g = vec2(lum(vUv + vec2(uTexel.x, 0.)) - c, lum(vUv + vec2(0., uTexel.y)) - c);
      vec3 n = normalize(vec3(-g * uBump, 1.));
      vec3 albedo = base.rgb * (1. - decal.a) + decal.rgb;
      vec3 lit = albedo * albedo * diffuse(vec3(uOrigin + vUv * uExtent, uZ), n);
      gl_FragColor = vec4(sqrt(clamp(lit, 0., 1.)), base.a * (1. - decal.a * .85));
    }`,
};

// Procedural wood, rendered once into a texture: boards glued edge to edge, cathedral grain warped by noise,
// pores streaked along the grain, butt joints for floor planks. RGB is albedo, A is how glossy the varnish is.
// The card's baked dirt (multiply) and scratches (screen) are folded in too; its light grease smears are left out,
// they read as bleached patches on dark wood.
export const WOOD = {
  vertex: `attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }`,
  fragment: `${PRECISION}
    uniform vec2 uSize; uniform float uSeed; uniform float uBoard; uniform float uPlank; uniform float uRing;
    uniform vec3 uLightWood; uniform vec3 uDarkWood; uniform float uVertical; uniform float uSeam;
    uniform sampler2D tDirt; uniform sampler2D tWear; uniform float uGrime;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
    }
    float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
    void main() {
      vec2 p = vUv * uSize;
      if (uVertical > .5) p = vec2(p.y, uSize.x - p.x);
      float b = floor(p.y / uBoard), bs = hash(vec2(b, uSeed));
      // Butt joints: every board is a run of planks of length uPlank, staggered per board.
      float off = bs * uPlank, seg = floor((p.x + off) / uPlank), ps = hash(vec2(b * 7.1 + seg, uSeed + 3.));
      float id = bs + ps;
      vec2 q = vec2(p.x + id * 3000., p.y - b * uBoard);
      // Cathedral grain: arches along the board, warped at two scales.
      float arch = 32. * sin(q.x * .0024 + id * 6.28) + 16. * sin(q.x * .0061 + id * 2.);
      float t = q.y + arch + 46. * fbm(vec2(q.x * .0016, q.y * .012 + id * 9.)) + 7. * fbm(q * vec2(.01, .1));
      float ring = fract(t / (uRing * (.8 + .5 * hash(vec2(id, 2.)))));
      float late = smoothstep(.5, .92, ring) * (1. - smoothstep(.95, 1., ring));
      float fine = noise(q * vec2(.03, .9)) * .5 + noise(q * vec2(.06, 1.7)) * .5;
      float pores = smoothstep(.72, .95, noise(q * vec2(.09, 2.2)));
      float tone = (hash(vec2(id, 5.)) - .5) * .22 + (fbm(p * .0012 + id) - .5) * .35;
      vec3 col = mix(uLightWood, uDarkWood, clamp(late * .5 + fine * .14 + .12, 0., 1.));
      col *= 1. + tone;
      col *= 1. - pores * .22;
      // Seams between boards and planks.
      float edgeY = min(q.y, uBoard - q.y), edgeX = min(fract((p.x + off) / uPlank), 1. - fract((p.x + off) / uPlank)) * uPlank;
      float seam = 1. - smoothstep(.3, 1.2, min(edgeY, edgeX));
      col *= 1. - seam * uSeam;
      float gloss = .82 - pores * .25 - seam * .6 + fine * .1;
      if (uGrime > 0.) {
        vec4 dirt = texture2D(tDirt, vUv), wear = texture2D(tWear, vUv);
        col *= 1. - dirt.a * .32 * (1. - dirt.rgb);
        col += wear.a * .5 * wear.rgb * (1. - col);
        gloss *= 1. - dirt.a * .5 - wear.a * .3;
      }
      gl_FragColor = vec4(col, clamp(gloss, 0., 1.));
    }`,
};
