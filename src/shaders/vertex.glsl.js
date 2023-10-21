const vertexShader = `
uniform vec3 uPointer;
uniform vec3 uColor;
uniform float uRotation;
uniform float uScale;
uniform float uHover;
uniform float uMaxDepth;
varying vec3 vColor;

#define PI 3.14159265359

mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat2(c, -s, s, c);
}

void main() {
  vec4 mvPosition = vec4(position, 1.0);
    mvPosition = instanceMatrix * mvPosition;

    vec4 clipSpacePosition = projectionMatrix * modelViewMatrix * mvPosition;
    vec3 ndc = clipSpacePosition.xyz / clipSpacePosition.w;  // Convert to NDC

    float d = distance(uPointer, ndc);  // We now measure the distance in NDC

    float c = smoothstep(0.5, 0.15, d);

    // Interpolate the color based on distance
    vColor = mix(uColor, vec3(0.61, 0.49, 0.96), c * 1.5);

    float scale = uScale + c * 3.0 * uHover;
    vec3 pos = position;
    pos *= scale;
    pos.xz *= rotate(PI * c * uRotation + PI * uRotation * 0.43);
    pos.xy *= rotate(PI * c * uRotation + PI * uRotation * 0.71);

    mvPosition = instanceMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
}
`
export default vertexShader;
