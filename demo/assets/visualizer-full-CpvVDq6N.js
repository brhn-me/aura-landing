import{At as e,Tt as t,_i as n,ai as r,bi as i,ci as a,hi as o,jt as s,kt as c,li as l,mi as u,oi as d,pi as f,si as p,ui as m,vi as h,wt as g,yi as _}from"./index-CV1B-rEu.js";var v=37,y=.8,b=64,x=e=>Number.isInteger(e)?e.toFixed(1):String(Number(e.toFixed(6))),S=`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;function C(e,t=!1){let n=p(e),r=e.textureNoise?`uniform sampler2D uNoise;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Value noise from a ${b}×${b} texture of random values: one lookup, smoothed like the hashed one.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return texture2D(uNoise, (i + u + 0.5) / ${b}.0).r;
}
`:`float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;return`
precision ${t?`highp`:`mediump`} float;
uniform vec2 uRes;
uniform float uFade;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uMusic;
uniform float uRed;
uniform float uViolet;

${r}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < ${e.octaves}; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// h: 0 at a curtain's lower rim, 1 at the tips of its rays.
vec3 palette(float h) {
  vec3 rimColor = vec3(0.55, 1.0, 0.62);
  vec3 green = vec3(0.16, 1.0, 0.5);
  vec3 teal = vec3(0.08, 0.78, 0.7);
  vec3 violet = vec3(0.52, 0.26, 0.92);
  vec3 c = mix(rimColor, green, smoothstep(0.0, 0.12, h));
  c = mix(c, teal, smoothstep(0.35, 0.75, h));
  c = mix(c, violet, smoothstep(0.72, 1.0, h) * mix(0.55, 0.35, uMusic));
  // Storms: red from the top of the curtains, spreading down as it builds.
  float from = mix(0.95, 0.2, uRed);
  c = mix(c, vec3(1.0, 0.1, 0.2), smoothstep(from, from + 0.3, h) * min(1.0, uRed * 1.6));
  // Bright highs: violet/magenta on the lower fringe.
  c = mix(c, vec3(0.85, 0.2, 0.95), (1.0 - smoothstep(0.0, 0.22, h)) * uViolet * 0.8);
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  float rimGlow = 0.0;

  for (int i = 0; i < ${e.curtains}; i++) {
    float fi = float(i);
    float x = p.x * (0.85 + 0.15 * fi) + fi * 2.9;
    // A ribbon hanging across the sky: big slow folds, a noisy wander, and ripple from the mids.
    float fold = sin(x * 1.15 + t * 0.07 + fi * 1.7) * 0.09 + sin(x * 2.4 - t * 0.05 + fi * 4.0) * 0.045;
    float wander = (fbm(vec2(x * 0.7 + t * 0.03, fi * 3.1 + t * 0.02)) - 0.5) * 0.24;
    float ripple = sin(x * 7.0 + t * 1.3 + fi * 2.1) * 0.012 * uMid
      + (fbm(vec2(x * 3.0 - t * 0.25, fi * 7.0 + t * 0.15)) - 0.5) * (0.02 + 0.1 * uMid);
    float rim = 0.5 + fi * 0.1 + fold + wander + ripple;
    // How far the rays reach up: the bass lifts them.
    float reach = 0.09 + 0.035 * fi + 0.2 * uBass;
    float d = p.y - rim;
    float above = smoothstep(-0.01, 0.025, d);
    float fade = exp(-max(d, 0.0) / reach);
    // Rays: noise stretched along y, drifting sideways.
    float ray = fbm(vec2(x * 15.0 + wander * 6.0 - t * 0.07, p.y * 1.3 - t * 0.1));
    // Pleats: brighter folds along the curtain.
    float pleat = 0.55 + 0.45 * sin(x * 9.0 + fbm(vec2(x * 2.0, t * 0.05 + fi)) * 6.0 + t * 0.2);
    ray = (ray * ray * 2.4 + 0.08) * pleat;
    float rimLine = exp(-abs(d) * 30.0) * (0.6 + 0.4 * pleat);
    float intensity = above * fade * ray + rimLine * 0.65 + exp(-abs(d) * 5.0) * 0.05;
    // Dark sky between the curtains.
    float gaps = smoothstep(0.26, 0.6, fbm(vec2(x * 0.45 - t * 0.02, fi * 5.3)));
    intensity *= gaps;
    // Highs: shimmer running along the rays.
    intensity *= 1.0 + uHigh * 1.2 * (noise(vec2(x * 46.0, t * 6.0 + p.y * 3.0)) - 0.45);
    float h = clamp(d / (reach * 2.4), 0.0, 1.0);
    float layer = (1.0 - fi * 0.28);
    col += palette(h) * intensity * (0.42 + 0.7 * uBass + 0.3 * uMid) * layer;
    rimGlow += rimLine * gaps * layer;
    // Storms: a diffuse red glow over the curtain tops, reaching higher as it builds.
    float redGlow = smoothstep(0.0, reach, d) * exp(-max(d - reach * 0.6, 0.0) / (0.12 + 0.22 * uRed)) * gaps;
    col += vec3(1.0, 0.1, 0.2) * redGlow * uRed * (0.35 + 0.4 * ray) * layer;
  }

  // Sparkles twinkling along the lower rims, with the highs.
  vec2 cell = floor(gl_FragCoord.xy / ${x(n.cell)});
  float seed = hash(cell);
  float twinkle = step(${x(n.threshold)}, seed) * max(0.0, sin(t * 3.0 + seed * 40.0));
  col += twinkle * uHigh * min(1.0, rimGlow * 1.5) * mix(vec3(0.85, 1.0, 0.95), vec3(0.92, 0.6, 1.0), uViolet);

  // Soft roll-off instead of clipping; fainter towards the bottom so the text stays readable.
  col = 1.0 - exp(-col * 1.3);
  col *= smoothstep(0.02, 0.4, uv.y) * 0.85 + 0.15;
  gl_FragColor = vec4(col * uFade, 1.0);
}
`}function w(e=b,t=3107613){let n=new Uint8Array(e*e),r=t>>>0;for(let e=0;e<n.length;e++)r^=r<<13,r>>>=0,r^=r>>>17,r^=r<<5,r>>>=0,n[e]=r&255;return n}function T(e){let t=e.createTexture();return e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.LUMINANCE,b,b,0,e.LUMINANCE,e.UNSIGNED_BYTE,w()),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),t}var E=37297;function D(e,t,n){let r=(t,n)=>{let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),r):null},i=r(e.VERTEX_SHADER,S),a=r(e.FRAGMENT_SHADER,C(t,n)),o=e.createProgram();return i&&a&&o&&(e.attachShader(o,i),e.attachShader(o,a),e.linkProgram(o)),{tier:t,vs:i,fs:a,program:o}}function O(e,t,n){return!n||!t.program||e.getProgramParameter(t.program,E)!==!1}function k(e,t){let{vs:n,fs:r,program:i,tier:a}=t;if(!(n&&r&&i&&e.getShaderParameter(n,e.COMPILE_STATUS)&&e.getShaderParameter(r,e.COMPILE_STATUS)&&e.getProgramParameter(i,e.LINK_STATUS)))return i&&e.deleteProgram(i),n&&e.deleteShader(n),r&&e.deleteShader(r),null;e.useProgram(i);let o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let s=e.getAttribLocation(i,`aPos`);e.enableVertexAttribArray(s),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0);let c=t=>e.getUniformLocation(i,t),l={res:c(`uRes`),time:c(`uTime`),bass:c(`uBass`),mid:c(`uMid`),high:c(`uHigh`),music:c(`uMusic`),red:c(`uRed`),violet:c(`uViolet`),fade:c(`uFade`)},u=null;return a.textureNoise&&(u=T(e),e.uniform1i(c(`uNoise`),0)),{program:i,vs:n,fs:r,buffer:o,noise:u,uniforms:l}}function A(e,t){e.isContextLost()||(e.deleteBuffer(t.buffer),t.noise&&e.deleteTexture(t.noise),e.deleteProgram(t.program),e.deleteShader(t.vs),e.deleteShader(t.fs))}function j(e,t){e.isContextLost()||(t.program&&e.deleteProgram(t.program),t.vs&&e.deleteShader(t.vs),t.fs&&e.deleteShader(t.fs))}function M(e){try{return(e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT)?.precision??0)>0}catch{return!1}}function N(e){let t=null;try{t=e.getExtension(`EXT_disjoint_timer_query`)}catch{t=null}if(!t)return null;let n=t,r=null,i=!1,a=null;return{begin(){r||(r=n.createQueryEXT(),n.beginQueryEXT(n.TIME_ELAPSED_EXT,r),i=!0)},end(){i&&(i=!1,n.endQueryEXT(n.TIME_ELAPSED_EXT))},read(){if(!r||i||!n.getQueryObjectEXT(r,n.QUERY_RESULT_AVAILABLE_EXT))return a;let t=!!e.getParameter(n.GPU_DISJOINT_EXT),o=Number(n.getQueryObjectEXT(r,n.QUERY_RESULT_EXT));return a=t||!Number.isFinite(o)?null:o/1e6,n.deleteQueryEXT(r),r=null,a},reset(){a=null}}}function P(e,t,s={}){if(h())return null;let c=e.getContext(`webgl`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`low-power`});if(!c)return null;let u=d({start:s.start??0,lowest:s.lowest,targetMs:s.targetMs??1e3/60,giveUp:s.giveUp}),p=s.now??(()=>performance.now()),m=M(c),g=!1;try{g=!!c.getExtension(`KHR_parallel_shader_compile`)}catch{g=!1}let b=N(c),x=s.forcedTier?.()??u.tier,S=e=>r[e]??r[0],C=null,w=null,T=D(c,S(x),m);if(O(c,T,g)){if(C=k(c,T),!C)return i(),null}else w={build:T,index:x};_.set(e,{gl:c,released:!1});let E=t===`music`;C&&c.uniform1f(C.uniforms.music,+!!E);let P=E?1:.65,F=l(),I=v,L=1,R=null,z={bass:0,mid:0,high:0},B=null,V=null,H=!1,U=null,W=!1,G=!1,K=e=>{V&&(c.viewport(0,0,V.width,V.height),c.uniform2f(e.uniforms.res,V.width,V.height))},q=()=>{B&&(V=a(S(x),B.width,B.height,B.dpr),e.width=V.width,e.height=V.height)},J=(e,t)=>{C&&A(c,C),C=e,c.useProgram(e.program),c.uniform1f(e.uniforms.music,+!!E),t!==x&&(x=t,q()),K(e)},Y=e=>{if(H)return;if(w){if(w.index===e)return;j(c,w.build),w=null}if(e===x&&C)return;let t=D(c,S(e),m);if(O(c,t,g)){let n=k(c,t);if(!n)return;J(n,e)}else w={build:t,index:e};u.reset(),b?.reset(),G=!1,U=null},X=()=>{if(!w||!O(c,w.build,g))return;let{build:e,index:t}=w;w=null;let n=k(c,e);if(n)return J(n,t);C||i()},Z=t=>{t.preventDefault(),!H&&(H=!0,C=null,w=null,!_.get(e)?.released&&n()&&i())},Q=()=>{if(_.get(e)?.released||h())return;let t=k(c,D(c,S(x),m));if(!t)return i();c.uniform1f(t.uniforms.music,+!!E),K(t),C=t,H=!1};e.addEventListener(`webglcontextlost`,Z),e.addEventListener(`webglcontextrestored`,Q);let $=()=>{let e=p(),t=U===null?null:e-U;U=e,t!==null&&t<=500&&V&&s.onFrame?.({intervalMs:t,tier:x,width:V.width,height:V.height});let n=s.forcedTier?.()??null;if(n!==null)return u.reset(),Y(n);if(x!==u.tier)return Y(u.tier);if(t===null||!C||w)return;let r=u.frame(e,t,b?.read());r===`down`?(s.onTier?.(u.tier,`down`),Y(u.tier)):r===`give-up`&&!W?(W=!0,s.onGiveUp?.(`frames too slow at the lowest tier (${S(x).name})`),i()):!G&&u.passed>0&&(G=!0,s.onTier?.(x,`held`))},ee=e=>{e<=0||(R===null&&I>300&&(R=`out`),R===`out`?(L=Math.max(0,L-e/y),L===0&&(I=v+Math.max(0,I-300),R=`in`)):R===`in`&&(L=Math.min(1,L+e/y),L===1&&(R=null)))};return{needs:`freq`,reset(){I=v,L=1,R=null,z.bass=z.mid=z.high=0,F=l(),U=null,u.reset()},pause(){U=null,u.reset()},resize(e,t,n){B={width:e,height:t,dpr:n},q(),C&&!H&&K(C),U=null,u.reset()},draw(e,t){if(H||W||c.isContextLost())return;X(),t>0?$():U=null;let n=C;if(!n||W||w?.index===x)return;let r=e?f(e.freq,e.sampleRate,e.fftSize):{bass:0,mid:0,high:0};z.bass=o(z.bass,Math.min(1,(r.bass*1.25)**1.5),t,.12,.45),z.mid=o(z.mid,Math.min(1,r.mid*1.6*P),t,.2,.6),z.high=o(z.high,Math.min(1,r.high*2.6),t,.08,.3),I+=t*P*(.35+.9*z.bass+.4*z.mid),ee(t);let i=E?F(r,t):{red:0,violet:0};c.uniform1f(n.uniforms.time,I),c.uniform1f(n.uniforms.fade,L),c.uniform1f(n.uniforms.bass,z.bass),c.uniform1f(n.uniforms.mid,z.mid),c.uniform1f(n.uniforms.high,z.high),c.uniform1f(n.uniforms.red,i.red),c.uniform1f(n.uniforms.violet,i.violet),t>0&&b?.begin(),c.drawArrays(c.TRIANGLES,0,3),b?.end()},dispose(){e.removeEventListener(`webglcontextlost`,Z),e.removeEventListener(`webglcontextrestored`,Q),w&&j(c,w.build),w=null;let t=C;C=null,t&&A(c,t)}}}function F(n){let r=e(n);if(!r)return null;let i=s(n),a=t(),o=0,l=new Float32Array,d=new Float32Array,f=[],p=0;return{needs:`freq`,get levels(){return l},reset(){l.fill(0),d.fill(0)},resize(e,t,n){r.resize(e,t,n),o=Math.max(8,Math.min(80,Math.floor((e+4)/12))),l=new Float32Array(o),d=new Float32Array(o)},draw(e,t){if(o===0)return;e?m(e.freq,a(o,e),d):d.fill(0),u(l,d,t,g.attack,g.release);let{ctx:n,size:s}=r;r.clear(),n.fillStyle=i;let h=(s.w-4*(o-1))/o;(f.length!==o||p!==h)&&(p=h,f=Array.from({length:o},(e,t)=>t*(h+4))),c(n,l,f,h,s.h,3,Math.min(h/2,2))},dispose(){}}}var I=e=>Math.min(3,Math.max(0,Math.round(e*3))),L=e=>.45+.55*e/3;function R(n,r){let i=e(n);if(!i)return null;let a=s(n),o=t(),c=new Float32Array(64),l=new Float32Array(64);return{needs:`freq`,reset(){c.fill(0),l.fill(0)},resize:i.resize,draw(e,t){e?m(e.freq,o(64,e),l):l.fill(0),u(c,l,t,.025,.22);let{ctx:n,size:s}=i;i.clear();let d=s.w/2,f=s.h/2,p=Math.min(d,f),h=p*r,g=p-h-2;n.strokeStyle=a,n.lineCap=`round`,n.lineWidth=Math.max(2,Math.PI*h/64*.5);for(let e=0;e<4;e++){let t=!1;for(let r=0;r<64;r++){let i=c[r];if(I(i)!==e)continue;t||n.beginPath(),t=!0;let a=3+i*(g-3);for(let e of[1,-1]){let t=Math.PI/2+e*((r+.5)/64)*Math.PI,i=Math.cos(t),o=Math.sin(t);n.moveTo(d+i*h,f+o*h),n.lineTo(d+i*(h+a),f+o*(h+a))}}t&&(n.globalAlpha=L(e),n.stroke())}n.globalAlpha=1},dispose(){}}}var z=e=>{let t=e.length>>1;for(let n=1;n<t;n++)if(e[n-1]<128&&e[n]>=128)return n;return 0};function B(t){let n=e(t);if(!n)return null;let r=s(t),i=new Float32Array,a=new Float32Array,c=2,l=(e,t,n,r)=>{let a=i.length,o=t/(a-1),s=e=>n+Math.max(-1,Math.min(1,i[e]*c))*r;e.beginPath(),e.moveTo(0,s(0));for(let t=1;t<a-1;t++){let n=t*o;e.quadraticCurveTo(n,s(t),n+o/2,(s(t)+s(t+1))/2)}e.lineTo(t,s(a-1))};return{needs:`wave`,reset(){i.fill(0),a.fill(0),c=2},resize(e,t,r){n.resize(e,t,r);let o=Math.max(32,Math.min(160,Math.floor(e/5)));i=new Float32Array(o),a=new Float32Array(o)},draw(e,t){let s=i.length;if(s===0)return;if(e){let n=z(e.wave),r=Math.min(768,e.wave.length-n),i=0;for(let t=0;t<s;t++){let o=n+Math.floor(t/s*r),c=Math.max(o+1,n+Math.floor((t+1)/s*r)),l=0;for(let t=o;t<c;t++)l+=e.wave[t]-128;let u=l/(c-o)/128,d=Math.min(1,Math.min(t,s-1-t)/(s*.08));a[t]=u*d,i+=u*u}let l=Math.sqrt(i/s);l>.002&&(c=o(c,Math.max(1,Math.min(16,.24/l)),t,.6,.6))}else a.fill(0);e?i.set(a):u(i,a,t,.01,.12);let{ctx:d,size:f}=n;n.clear();let p=f.h/2,m=f.h/2-5;d.strokeStyle=r,d.lineJoin=`round`,d.lineCap=`round`,d.globalAlpha=.22,d.lineWidth=8,l(d,f.w,p,m),d.stroke(),d.globalAlpha=1,d.lineWidth=2.5,l(d,f.w,p,m),d.stroke()},dispose(){}}}function V(e,t,n,r){switch(e){case`bars`:return F(t);case`circular`:return R(t,n);case`waveform`:return B(t);case`aurora`:return P(t,`music`,r);case`aurora-green`:return P(t,`green`,r)}}export{V as createFull};