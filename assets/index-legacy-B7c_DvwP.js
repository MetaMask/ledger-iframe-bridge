System.register(["./vendor-legacy-Cdg_s1Qc.js"],(function(e,s){"use strict";var t,a,n,r;return{setters:[e=>{t=e._,a=e.E,n=e.T,r=e.a}],execute:function(){const e="ws://localhost:8435";class s{constructor(){this.addEventListeners(),this.transportType="u2f"}addEventListeners(){window.addEventListener("message",(async e=>{if(e&&e.data&&"LEDGER-IFRAME"===e.data.target){const{action:s,params:t,messageId:a}=e.data,n=`${s}-reply`;switch(s){case"ledger-unlock":this.unlock(n,t.hdPath,a);break;case"ledger-sign-transaction":console.log("ledger-sign-transaction",t),this.signTransaction(n,t.hdPath,t.tx,a);break;case"ledger-sign-personal-message":this.signPersonalMessage(n,t.hdPath,t.message,a);break;case"ledger-close-bridge":this.cleanUp(n,a);break;case"ledger-update-transport":"ledgerLive"===t.transportType||t.useLedgerLive?this.updateTransportTypePreference(n,"ledgerLive",a):"webhid"===t.transportType?this.updateTransportTypePreference(n,"webhid",a):this.updateTransportTypePreference(n,"u2f",a);break;case"ledger-make-app":this.attemptMakeApp(n,a);break;case"ledger-sign-typed-data":this.signTypedData(n,t.hdPath,t.message,a)}}}),!1)}sendMessageToExtension(e){window.parent.postMessage(e,"*")}delay(e){return new Promise((s=>setTimeout(s,e)))}checkTransportLoop(s){const a=s||0;return t.check(e).catch((async()=>{if(await this.delay(1e3),a<120)return this.checkTransportLoop(a+1);throw new Error("Ledger transport check timeout")}))}async attemptMakeApp(e,s){try{await this.makeApp({openOnly:!0}),await this.cleanUp(),this.sendMessageToExtension({action:e,success:!0,messageId:s})}catch(t){await this.cleanUp(),this.sendMessageToExtension({action:e,success:!1,messageId:s,error:t})}}async makeApp(s={}){try{if("ledgerLive"===this.transportType){let s=!1;try{await t.check(e)}catch(i){window.open("ledgerlive://bridge?appName=Ethereum"),await this.checkTransportLoop(),s=!0}this.app&&!s||(this.transport=await t.open(e),this.app=new a(this.transport))}else if("webhid"===this.transportType){const e=this.transport&&this.transport.device,t=e&&e.constructor.name,r=e&&e.opened;if(this.app&&"HIDDevice"===t&&r)return;this.transport=s.openOnly?await n.openConnected():await n.create(),this.app=new a(this.transport)}else this.transport=await r.create(),this.app=new a(this.transport)}catch(o){throw console.log("LEDGER:::CREATE APP ERROR",o),o}}updateTransportTypePreference(e,s,t){this.transportType=s,this.cleanUp(),this.sendMessageToExtension({action:e,success:!0,messageId:t})}async cleanUp(e,s){this.app=null,this.transport&&(await this.transport.close(),this.transport=null),e&&this.sendMessageToExtension({action:e,success:!0,messageId:s})}async unlock(e,s,t){try{await this.makeApp();const a=await this.app.getAddress(s,!1,!0);this.sendMessageToExtension({action:e,success:!0,payload:a,messageId:t})}catch(a){const s=this.ledgerErrToMessage(a);this.sendMessageToExtension({action:e,success:!1,payload:{error:s},messageId:t})}finally{"ledgerLive"!==this.transportType&&this.cleanUp()}}async signTransaction(e,s,t,a){try{await this.makeApp();const n=await this.app.clearSignTransaction(s,t);this.sendMessageToExtension({action:e,success:!0,payload:n,messageId:a})}catch(n){const s=this.ledgerErrToMessage(n);this.sendMessageToExtension({action:e,success:!1,payload:{error:s},messageId:a})}finally{"ledgerLive"!==this.transportType&&this.cleanUp()}}async signPersonalMessage(e,s,t,a){try{await this.makeApp();const n=await this.app.signPersonalMessage(s,t);this.sendMessageToExtension({action:e,success:!0,payload:n,messageId:a})}catch(n){const s=this.ledgerErrToMessage(n);this.sendMessageToExtension({action:e,success:!1,payload:{error:s},messageId:a})}finally{"ledgerLive"!==this.transportType&&this.cleanUp()}}async signTypedData(e,s,t,a){try{await this.makeApp();const n=await this.app.signEIP712Message(s,t);this.sendMessageToExtension({action:e,success:!0,payload:n,messageId:a})}catch(n){const s=this.ledgerErrToMessage(n);this.sendMessageToExtension({action:e,success:!1,payload:{error:s},messageId:a})}finally{this.cleanUp()}}ledgerErrToMessage(e){return(e=>!!e&&!!e.metaData)(e)?5===e.metaData.code?new Error("LEDGER_TIMEOUT"):e.metaData.type:(e=>String(e.message||e).includes("6804"))(e)?new Error("LEDGER_WRONG_APP"):(e=>e.message&&e.message.includes("OpenFailed"))(e)||(e=>"string"==typeof e)(e)&&e.includes("6801")?new Error("LEDGER_LOCKED"):(e=>e.hasOwnProperty("id")&&e.hasOwnProperty("message"))(e)&&e.message.includes("U2F not supported")?new Error("U2F_NOT_SUPPORTED"):e}}(async()=>{new s})(),console.log(`MetaMask < = > Ledger Bridge initialized from ${window.location}!`)}}}));
