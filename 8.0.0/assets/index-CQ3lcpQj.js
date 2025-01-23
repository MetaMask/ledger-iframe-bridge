import{_ as o,E as c,T as l,a as h}from"./vendor-CB8ZuWRz.js";function y(){import.meta.url,import("_").catch(()=>1),async function*(){}().next()}(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();const p="ws://localhost:8435",g=1e3,u=120;class f{constructor(){this.addEventListeners(),this.transportType="u2f"}addEventListeners(){window.addEventListener("message",async e=>{if(e&&e.data&&e.data.target==="LEDGER-IFRAME"){const{action:t,params:r,messageId:s}=e.data,a="".concat(t,"-reply");switch(t){case"ledger-unlock":this.unlock(a,r.hdPath,s);break;case"ledger-sign-transaction":console.log("ledger-sign-transaction",r),this.signTransaction(a,r.hdPath,r.tx,s);break;case"ledger-sign-personal-message":this.signPersonalMessage(a,r.hdPath,r.message,s);break;case"ledger-close-bridge":this.cleanUp(a,s);break;case"ledger-update-transport":r.transportType==="ledgerLive"||r.useLedgerLive?this.updateTransportTypePreference(a,"ledgerLive",s):r.transportType==="webhid"?this.updateTransportTypePreference(a,"webhid",s):this.updateTransportTypePreference(a,"u2f",s);break;case"ledger-make-app":this.attemptMakeApp(a,s);break;case"ledger-sign-typed-data":this.signTypedData(a,r.hdPath,r.message,s);break}}},!1)}sendMessageToExtension(e){window.parent.postMessage(e,"*")}delay(e){return new Promise(t=>setTimeout(t,e))}checkTransportLoop(e){const t=e||0;return o.check(p).catch(async()=>{if(await this.delay(g),t<u)return this.checkTransportLoop(t+1);throw new Error("Ledger transport check timeout")})}async attemptMakeApp(e,t){try{await this.makeApp({openOnly:!0}),await this.cleanUp(),this.sendMessageToExtension({action:e,success:!0,messageId:t})}catch(r){await this.cleanUp(),this.sendMessageToExtension({action:e,success:!1,messageId:t,error:r})}}async makeApp(e={}){try{if(this.transportType==="ledgerLive"){let t=!1;try{await o.check(p)}catch(r){window.open("ledgerlive://bridge?appName=Ethereum"),await this.checkTransportLoop(),t=!0}(!this.app||t)&&(this.transport=await o.open(p),this.app=new c(this.transport))}else if(this.transportType==="webhid"){const t=this.transport&&this.transport.device,r=t&&t.constructor.name,s=t&&t.opened;if(this.app&&r==="HIDDevice"&&s)return;this.transport=e.openOnly?await l.openConnected():await l.create(),this.app=new c(this.transport)}else this.transport=await h.create(),this.app=new c(this.transport)}catch(t){throw console.log("LEDGER:::CREATE APP ERROR",t),t}}updateTransportTypePreference(e,t,r){this.transportType=t,this.cleanUp(),this.sendMessageToExtension({action:e,success:!0,messageId:r})}async cleanUp(e,t){this.app=null,this.transport&&(await this.transport.close(),this.transport=null),e&&this.sendMessageToExtension({action:e,success:!0,messageId:t})}async unlock(e,t,r){try{await this.makeApp();const s=await this.app.getAddress(t,!1,!0);this.sendMessageToExtension({action:e,success:!0,payload:s,messageId:r})}catch(s){const a=this.ledgerErrToMessage(s);this.sendMessageToExtension({action:e,success:!1,payload:{error:a},messageId:r})}finally{this.transportType!=="ledgerLive"&&this.cleanUp()}}async signTransaction(e,t,r,s){try{await this.makeApp();const a=await this.app.clearSignTransaction(t,r,{nft:!0,externalPlugins:!0,erc20:!0});this.sendMessageToExtension({action:e,success:!0,payload:a,messageId:s})}catch(a){const i=this.ledgerErrToMessage(a);this.sendMessageToExtension({action:e,success:!1,payload:{error:i},messageId:s})}finally{this.transportType!=="ledgerLive"&&this.cleanUp()}}async signPersonalMessage(e,t,r,s){try{await this.makeApp();const a=await this.app.signPersonalMessage(t,r);this.sendMessageToExtension({action:e,success:!0,payload:a,messageId:s})}catch(a){const i=this.ledgerErrToMessage(a);this.sendMessageToExtension({action:e,success:!1,payload:{error:i},messageId:s})}finally{this.transportType!=="ledgerLive"&&this.cleanUp()}}async signTypedData(e,t,r,s){try{await this.makeApp();const a=await this.app.signEIP712Message(t,r);this.sendMessageToExtension({action:e,success:!0,payload:a,messageId:s})}catch(a){const i=this.ledgerErrToMessage(a);this.sendMessageToExtension({action:e,success:!1,payload:{error:i},messageId:s})}finally{this.cleanUp()}}ledgerErrToMessage(e){const t=n=>!!n&&!!n.metaData,r=n=>typeof n=="string",s=n=>n.hasOwnProperty("id")&&n.hasOwnProperty("message"),a=n=>String(n.message||n).includes("6804"),i=n=>n.message&&n.message.includes("OpenFailed");return t(e)?e.metaData.code===5?new Error("LEDGER_TIMEOUT"):e.metaData.type:a(e)?new Error("LEDGER_WRONG_APP"):i(e)||r(e)&&e.includes("6801")?new Error("LEDGER_LOCKED"):s(e)&&e.message.includes("U2F not supported")?new Error("U2F_NOT_SUPPORTED"):e}}(async()=>new f)();console.log("MetaMask < = > Ledger Bridge initialized from ".concat(window.location,"!"));export{y as __vite_legacy_guard};