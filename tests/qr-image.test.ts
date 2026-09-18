import {test,expect} from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {freshProgress,stateFor} from '../src/progress';
import {SKILLS} from '../src/catalog';
import {makePortableProgress,encodeProgress,splitIntoQrFrames,QrCollector,decodeProgress} from '../src/transfer';
test('full-curriculum snapshot survives raster QR encoding and local image decoding',()=>{
 const now=Date.now(),p=freshProgress({schemaVersion:1,revision:'test',initialUnlockedLevel:6,disabledFamilies:[],sessionLength:12},now);
 SKILLS.forEach((s,i)=>{const state=stateFor(p,s.id,now);state.card.stability=i+0.123456789012345;state.recent=[0,1,2,3,4].map(n=>({q:`${s.id}-${n}`,template:n%2,correct:true}));});
 const snapshot=makePortableProgress(p,now),code=encodeProgress(snapshot),frames=splitIntoQrFrames(code),collector=new QrCollector();let result;
 for(const frame of [...frames].reverse()){
  const qr=QRCode.create(frame,{errorCorrectionLevel:'M'}),size=qr.modules.size,scale=3,width=(size+8)*scale,pixels=new Uint8ClampedArray(width*width*4);pixels.fill(255);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.modules.get(y,x))for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const i=(((y+4)*scale+dy)*width+(x+4)*scale+dx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
  const decoded=jsQR(pixels,width,width);expect(decoded?.data).toBe(frame);result=collector.add(decoded!.data);
 }
 expect(decodeProgress(result!.code!)).toEqual(snapshot);
});
