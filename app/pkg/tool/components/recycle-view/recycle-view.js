import{t as u}from"./transformRpx.js";const f=4,p=200,_=wx.getSystemInfoSync();Component({properties:{width:{type:Number,value:_.windowWidth,public:!0,observer:"_widthChanged"},height:{type:Number,value:_.windowHeight,public:!0,observer:"_heightChanged"},debug:{type:Boolean,value:!1},scrollY:{type:Boolean,value:!0},batch:{type:Boolean,value:!1,public:!0,observer:"_recycleInnerBatchDataChanged"},batchKey:{type:String,value:"batchSetRecycleData",public:!0},scrollTop:{type:Number,value:0,public:!0,observer:"_scrollTopChanged",observeAssignments:!0},upperThreshold:{type:Number,value:50,public:!0},lowerThreshold:{type:Number,value:50,public:!0},scrollToIndex:{type:Number,public:!0,value:0,observer:"_scrollToIndexChanged",observeAssignments:!0},scrollWithAnimation:{type:Boolean,public:!0,value:!1},enableBackToTop:{type:Boolean,public:!0,value:!1},throttle:{type:Boolean,public:!0,value:!0},placeholderImage:{type:String,public:!0,value:""},screen:{type:Number,public:!0,value:f}},options:{multipleSlots:!0},relations:{"./recycle-item":{type:"child",linked(e){if(!this._hasCheckSize){this._hasCheckSize=!0;const t=this.boundingClientRect(this._pos.beginIndex);if(!t)return;setTimeout(()=>{try{e.createSelectorQuery().select(".wx-recycle-item").boundingClientRect(i=>{i&&(i.width!==t.width||i.height!==t.height)&&console.warn(`[recycle-view] the size in <recycle-item> is not the same with param itemSize, expect {width: ${i.width}, height: ${i.height}} but got {width: ${t.width}, height: ${t.height}}`)}).exec()}catch(i){}},10)}}}},data:{innerBeforeHeight:0,innerAfterHeight:0,innerScrollTop:0,innerScrollIntoView:"",placeholderImageStr:"",totalHeight:0,useInPage:!1},attached(){this.data.placeholderImage&&this.setData({placeholderImageStr:u(this.data.placeholderImage,!0)}),this.setItemSize({array:[],map:{},totalHeight:0})},ready(){this._initPosition(()=>{this._isReady=!0,!this._updateTimerId&&this._scrollViewDidScroll({detail:{scrollLeft:this._pos.left,scrollTop:this._pos.top,ignoreScroll:!0}},!0)})},detached(){this.page=null,this.context&&(this.context.destroy(),this.context=null)},methods:{_log(...e){if(!this.data.debug)return;const t=new Date,i=`${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}.${t.getMilliseconds()}`;Array.prototype.splice.call(e,0,0,i),console.log(...e)},_scrollToUpper(e){this.triggerEvent("scrolltoupper",e.detail)},_scrollToLower(e){this.triggerEvent("scrolltolower",e.detail)},_beginToScroll(){this._lastScrollTop||(this._lastScrollTop=this._pos&&(this._pos.top||0))},_clearList(e){this.currentScrollTop=0,this._lastScrollTop=0;const t=this._pos;t.beginIndex=this._pos.endIndex=-1,t.afterHeight=t.minTop=t.maxTop=0,this.page._recycleViewportChange({detail:{data:t,id:this.id}},e)},_isValid(){return this.page&&this.context&&this.context.isDataReady},_scrollViewDidScroll(e,t){if(!this._isValid())return;if(e.detail.ignoreScroll||this.triggerEvent("scroll",e.detail),this.currentScrollTop=e.detail.scrollTop,!this._pos.height||!this.sizeArray.length){this._clearList(e.detail.cb);return}if(this._isScrollingWithAnimation){this._isScrollingWithAnimation=!1;return}const i=this._pos,o=this,r=e.detail.scrollLeft,s=e.detail.scrollTop,l=Math.abs(s-this._lastScrollTop);if(!t&&Math.abs(s-i.top)<i.height*1.5){this._log("【not exceed height");return}this._lastScrollTop=s;const h=this.data.screen;this._log("SHOW_SCREENS",h,s),this._calcViewportIndexes(r,s,(a,n,c,d,g)=>{if(o._log("scrollDistance",l,"indexes",a,n),!t&&i.beginIndex===a&&i.endIndex===n&&i.minTop===c&&i.afterHeight===d){o._log("------------is the same beginIndex and endIndex");return}o._log("【check】before setData, old pos is",i.minTop,i.maxTop,c,g),o._throttle=!1,i.left=r,i.top=s,i.beginIndex=a,i.endIndex=n,i.minTop=c,i.maxTop=g,i.afterHeight=d,i.ignoreBeginIndex=i.ignoreEndIndex=-1,o.page._recycleViewportChange({detail:{data:o._pos,id:o.id}},()=>{e.detail.cb&&e.detail.cb()})})},_calcViewportIndexes(e,t,i){const o=this;this._getBeforeSlotHeight(()=>{const{beginIndex:r,endIndex:s,minTop:l,afterHeight:h,maxTop:a}=o.__calcViewportIndexes(e,t);i&&i(r,s,l,h,a)})},_getBeforeSlotHeight(e){typeof this.data.beforeSlotHeight!="undefined"?e&&e(this.data.beforeSlotHeight):this.reRender(e)},_getAfterSlotHeight(e){typeof this.data.afterSlotHeight!="undefined"?e&&e(this.data.afterSlotHeight):this.reRender(e)},_getIndexes(e,t){if(e===t&&t===0)return{beginIndex:-1,endIndex:-1};const i=Math.floor(e/p),o=Math.ceil(t/p),r=Math.floor(this.data.width/p);let s,l;const h=this.sizeMap;for(let a=i;a<=o;a++)for(let n=0;n<r;n++){const c=`${a}.${n}`;if(h[c])for(let d=0;d<h[c].length;d++){if(typeof s=="undefined"){s=l=h[c][d];continue}s>h[c][d]?s=h[c][d]:l<h[c][d]&&(l=h[c][d])}}return{beginIndex:s,endIndex:l}},_isIndexValid(e,t){return!(typeof e=="undefined"||e===-1||typeof t=="undefined"||t===-1||t>=this.sizeArray.length)},__calcViewportIndexes(e,t){if(!this.sizeArray.length)return{};const i=this._pos;typeof e=="undefined"&&(e=i.left),typeof t=="undefined"&&(t=i.top);const o=this.data.beforeSlotHeight||0,r=this.data.screen;let s=t-i.height*r-o,l=t+i.height*r-o;l>this.totalHeight&&(s-=l-this.totalHeight,l=this.totalHeight),s<o&&(l+=Math.min(o-s,this.totalHeight),s=0);const h=this._getIndexes(s,l),a=h.beginIndex;let n=h.endIndex;if(n>=this.sizeArray.length&&(n=this.sizeArray.length-1),!this._isIndexValid(a,n))return{beginIndex:-1,endIndex:-1,minTop:0,afterHeight:0,maxTop:0};const c=this.sizeArray[n].beforeHeight+this.sizeArray[n].height,d=this.sizeArray[a].beforeHeight,g=this.totalHeight-c;return{beginIndex:a,endIndex:n,minTop:d,afterHeight:g,maxTop:l}},setItemSize(e){this.sizeArray=e.array,this.sizeMap=e.map,e.totalHeight!==this.totalHeight&&this.setData({totalHeight:e.totalHeight,useInPage:this.useInPage||!1}),this.totalHeight=e.totalHeight},setList(e,t){this._currentSetDataKey=e,this._currentSetDataList=t},setPage(e){this.page=e},forceUpdate(e,t){if(!this._isReady){this._updateTimerId&&clearTimeout(this._updateTimerId),this._updateTimerId=setTimeout(()=>{this.forceUpdate(e,t)},10);return}this._updateTimerId=null;const i=this;t?this.reRender(()=>{i._scrollViewDidScroll({detail:{scrollLeft:i._pos.left,scrollTop:i.currentScrollTop||i.data.scrollTop||0,ignoreScroll:!0,cb:e}},!0)}):this._scrollViewDidScroll({detail:{scrollLeft:i._pos.left,scrollTop:i.currentScrollTop||i.data.scrollTop||0,ignoreScroll:!0,cb:e}},!0)},_initPosition(e){const t=this;t._pos={left:t.data.scrollLeft||0,top:t.data.scrollTop||0,width:this.data.width,height:Math.max(500,this.data.height),direction:0},this.reRender(e)},_widthChanged(e){return this._isReady&&(this._pos.width=e,this.forceUpdate()),e},_heightChanged(e){return this._isReady&&(this._pos.height=Math.max(500,e),this.forceUpdate()),e},reRender(e){let t,i;const o=this;function r(){(o._lastBeforeSlotHeight!==t||o._lastAfterSlotHeight!==i)&&o.setData({hasBeforeSlotHeight:!0,hasAfterSlotHeight:!0,beforeSlotHeight:t,afterSlotHeight:i}),o._lastBeforeSlotHeight=t,o._lastAfterSlotHeight=i,e&&e()}let s=!1,l=!1;this.setData({hasBeforeSlotHeight:!1,hasAfterSlotHeight:!1},()=>{this.createSelectorQuery().select(".slot-before").boundingClientRect(h=>{t=h.height,s=!0,l&&r&&r()}).exec(),this.createSelectorQuery().select(".slot-after").boundingClientRect(h=>{i=h.height,l=!0,s&&r&&r()}).exec()})},_setInnerBeforeAndAfterHeight(e){typeof e.beforeHeight!="undefined"&&(this._tmpBeforeHeight=e.beforeHeight),e.afterHeight&&(this._tmpAfterHeight=e.afterHeight)},_recycleInnerBatchDataChanged(e){if(typeof this._tmpBeforeHeight!="undefined"){const t={innerBeforeHeight:this._tmpBeforeHeight||0,innerAfterHeight:this._tmpAfterHeight||0};typeof this._tmpInnerScrollTop!="undefined"&&(t.innerScrollTop=this._tmpInnerScrollTop);const i={};let o=!1;typeof this._currentSetDataKey!="undefined"&&(i[this._currentSetDataKey]=this._currentSetDataList,o=!0);const r=this.data.scrollWithAnimation;o&&this.page.setData(i),this.setData(t,()=>{this.setData({scrollWithAnimation:r}),typeof e=="function"&&e()}),delete this._currentSetDataKey,delete this._currentSetDataList,this._tmpBeforeHeight=void 0,this._tmpAfterHeight=void 0,this._tmpInnerScrollTop=void 0}},_renderByScrollTop(e){this._scrollViewDidScroll({detail:{scrollLeft:this._pos.scrollLeft,scrollTop:e,ignoreScroll:!0}},!0),this.data.scrollWithAnimation&&(this._isScrollingWithAnimation=!0),this.setData({innerScrollTop:e})},_scrollTopChanged(e,t){return!this._isInitScrollTop&&e===0?(this._isInitScrollTop=!0,e):(this.currentScrollTop=e,this._isReady?(this._isInitScrollTop=!0,this._scrollTopTimerId=null,typeof this._lastScrollTop=="undefined"&&(this._lastScrollTop=this.data.scrollTop),Math.abs(e-this._lastScrollTop)<this._pos.height?(this.setData({innerScrollTop:e}),e):(this._isScrollTopChanged?this._renderByScrollTop(e):setTimeout(()=>{this._isScrollTopChanged=!0,this._renderByScrollTop(e)},10),e)):(this._scrollTopTimerId&&clearTimeout(this._scrollTopTimerId),this._scrollTopTimerId=setTimeout(()=>{this._scrollTopChanged(e,t)},10),e))},_scrollToIndexChanged(e,t){if(!this._isInitScrollToIndex&&e===0)return this._isInitScrollToIndex=!0,e;if(!this._isReady)return this._scrollToIndexTimerId&&clearTimeout(this._scrollToIndexTimerId),this._scrollToIndexTimerId=setTimeout(()=>{this._scrollToIndexChanged(e,t)},10),e;this._isInitScrollToIndex=!0,this._scrollToIndexTimerId=null,typeof this._lastScrollTop=="undefined"&&(this._lastScrollTop=this.data.scrollTop);const i=this.boundingClientRect(e);if(!i)return e;const o=i.top+(this.data.beforeSlotHeight||0);return this.currentScrollTop=o,Math.abs(o-this._lastScrollTop)<this._pos.height?(this.setData({innerScrollTop:o}),e):(this._isScrollToIndexChanged?this._renderByScrollTop(o):setTimeout(()=>{this._isScrollToIndexChanged=!0,this._renderByScrollTop(o)},10),e)},boundingClientRect(e){return e<0||e>=this.sizeArray.length?null:{left:0,top:this.sizeArray[e].beforeHeight,width:this.sizeArray[e].width,height:this.sizeArray[e].height}},getIndexesInViewport(e){e||(e=1);const t=this.currentScrollTop;let i=t+e;i<0&&(i=0);let o=t+this.data.height-e;o>this.totalHeight&&(o=this.totalHeight);const r=[];for(let s=0;s<this.sizeArray.length&&(this.sizeArray[s].beforeHeight+this.sizeArray[s].height>=i&&this.sizeArray[s].beforeHeight<=o&&r.push(s),!(this.sizeArray[s].beforeHeight>o));s++);return r},getTotalHeight(){return this.totalHeight},setUseInPage(e){this.useInPage=e},setPlaceholderImage(e,t){const i="style='fill:rgb(204,204,204);'",o=[`data:image/svg+xml,%3Csvg height='${t.height}' width='${t.width}' xmlns='http://www.w3.org/2000/svg'%3E`];e.forEach(r=>{o.push(`%3Crect width='${r.width}' x='${r.left}' height='${r.height}' y='${r.top}' ${i} /%3E`)}),o.push("%3C/svg%3E"),this.setData({placeholderImageStr:o.join("")})}}});
//# sourceMappingURL=recycle-view.js.map