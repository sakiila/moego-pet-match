import type { SocialPerson, SocialState, SocialPet } from '../../social/model';
import { emptyReactions } from '../../social/model';
import cat from './assets/demo-cat-v1.webp';
import dog from './assets/demo-dog-v1.webp';
import paws from './assets/demo-paws-v1.webp';

export const previewViewer: SocialPerson = { id: 'demo-bob', name: 'Bob' };
const erika: SocialPerson = { id: 'demo-erika', name: 'Erika Intfen' };
const alex: SocialPerson = { id: 'demo-alex', name: 'Alex' };
export const previewPets: SocialPet[] = [{ id: 'demo-cat', name: 'Demo Cat' }];
const source = 'https://app.slack.com/client/T011CF3CMJN/C0APZBRK49E';

/** 所有互动及照片是独立演示内容，不代表实际 Slack 导入或宠物资料。 */
export function createSocialFixtures(): SocialState {
  return {
    version: 1,
    posts: [
      {
        id: 'demo-slack-puppy',
        author: erika,
        source: 'slack',
        sourceUrl: source,
        createdAt: '2026-10-22T00:16:44+08:00',
        body: 'Not parvo safe for a while, so stroller walks it is for now 💖',
        photos: [{ id: 'demo-dog', src: dog, alt: 'Synthetic demo: a copper puppy in a green stroller' }],
        reactions: { cute: ['a', 'b', 'c', 'd'], pets: ['a', 'b'], play: ['c'], love: ['a', 'b', 'd'] },
        comments: [
          { id: 'demo-comment-1', author: alex, body: '这位乘客也太可爱了！', createdAt: '2026-10-25T10:20:00+08:00' },
          {
            id: 'demo-comment-2',
            author: previewViewer,
            body: '出门兜风也要坐专车。',
            createdAt: '2026-10-26T09:30:00+08:00',
          },
        ],
      },
      {
        id: 'demo-native-cat',
        author: previewViewer,
        source: 'native',
        createdAt: '2026-10-26T09:26:00+08:00',
        body: '今天的阳光，被它承包了。',
        photos: [
          { id: 'demo-cat-1', src: cat, alt: 'Synthetic demo: a tabby cat basking in sunlight' },
          { id: 'demo-cat-2', src: paws, alt: 'Synthetic demo: the tabby cat’s white paws' },
        ],
        reactions: { cute: ['a', 'b', 'c', 'd'], pets: ['a', 'b'], play: [previewViewer.id], love: ['a', 'b', 'c'] },
        comments: [
          {
            id: 'demo-comment-3',
            author: { id: 'demo-sam', name: 'Sam' },
            body: '这个睡姿也太舒服了。',
            createdAt: '2026-10-26T10:28:00+08:00',
          },
        ],
      },
      {
        id: 'demo-own-slack',
        author: previewViewer,
        source: 'slack',
        sourceUrl: source,
        createdAt: '2026-10-24T14:18:00+08:00',
        body: '演示：换了新窝，马上就睡着了。',
        photos: [{ id: 'demo-cat-3', src: cat, alt: 'Synthetic demo cat photo' }],
        reactions: emptyReactions(),
        comments: [],
      },
    ],
    notices: [
      {
        id: 'demo-n1',
        postId: 'demo-native-cat',
        recipientId: previewViewer.id,
        actor: alex,
        kind: 'play',
        read: false,
        createdAt: '2026-10-26T10:32:00+08:00',
      },
      {
        id: 'demo-n2',
        postId: 'demo-native-cat',
        recipientId: previewViewer.id,
        actor: { id: 'demo-sam', name: 'Sam' },
        kind: 'comment',
        excerpt: '这个睡姿也太舒服了。',
        read: false,
        createdAt: '2026-10-26T10:28:00+08:00',
      },
      {
        id: 'demo-n3',
        postId: 'demo-native-cat',
        recipientId: previewViewer.id,
        actor: { id: 'demo-mia', name: 'Mia' },
        kind: 'love',
        read: false,
        createdAt: '2026-10-26T09:41:00+08:00',
      },
      {
        id: 'demo-n4',
        postId: 'demo-own-slack',
        recipientId: previewViewer.id,
        actor: { id: 'demo-jamie', name: 'Jamie' },
        kind: 'cute',
        read: true,
        createdAt: '2026-10-25T20:14:00+08:00',
      },
    ],
  };
}
