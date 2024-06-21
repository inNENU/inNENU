let p=!1,s,n;const c=()=>{const t=wx.getSystemInfoSync(),o=t.screenWidth||375,r=t.pixelRatio||2;p=t.platform==="ios",(o!==s||r!==n)&&(s=o,n=r)};c();const a=1e-4,f=t=>t===0?0:(t=t/750*s,t=Math.floor(t+a),t===0?n===1||!p?1:.5:t),x=/([+-]?\d+(?:\.\d+)?)rpx/gi,e=(t,o=!1)=>typeof t!="string"?t:t.replace(x,(r,i)=>f(Number(i))+(o?"px":""));export{e as t};
//# sourceMappingURL=transformRpx.js.map
