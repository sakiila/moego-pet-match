/** 独立重试 CDN 清理，适用于已经下架成墓碑的宠物；默认只预览 URL。 */
import { createImageCdnPurger, stickerPurgeUrls } from '../src/services/imageCdn.ts';

const args = process.argv.slice(2);
const ids = args.slice(1).filter(arg => !arg.startsWith('--'));
if (args[0] !== 'purge' || ids.length !== 1) throw new Error('usage: image-cache.ts purge <pet_id> [--fish] [--prod --yes]');
const kind = args.includes('--fish') ? 'fish' : 'pets';
console.log(`target: star.baobo.me CDN${args.includes('--yes') ? '' : ' · DRY RUN'}`);
for (const url of stickerPurgeUrls(ids[0], kind)) console.log(url);
if (args.includes('--yes')) {
  if (!args.includes('--prod')) throw new Error('CDN writes require --prod --yes');
  await createImageCdnPurger()(ids[0], kind);
  console.log('CDN sticker cache purged.');
}
