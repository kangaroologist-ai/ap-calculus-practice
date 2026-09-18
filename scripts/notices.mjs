import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
let text='# Third-party notices\n\nThese libraries are bundled with Derivative Studio.\n';
for(const name of Object.keys(pkg.dependencies)){
 const root=`node_modules/${name}`;const meta=JSON.parse(readFileSync(`${root}/package.json`,'utf8'));
 const license=readdirSync(root).find(x=>/^licen[cs]e(\.|$)/i.test(x));
 text+=`\n## ${name} ${meta.version} (${meta.license})\n\n`+(license?readFileSync(`${root}/${license}`,'utf8'):'See the package distribution for license text.')+'\n';
}
writeFileSync('public/third-party-notices.txt',text);
