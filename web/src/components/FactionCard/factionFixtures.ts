import type { FactionView } from '../../api/types';

/** 陈列页示例数据（不访问接口）。 */
const base: FactionView = {
  phase: 'active',
  eventId: 'catdog-2026',
  startsOn: '2026-10-27',
  endsOn: '2026-11-02',
  sides: {
    cat: { members: 18, active: 14, factor: 1.14, points: 10950, adjusted: 12483 },
    dog: { members: 21, active: 16, factor: 1, points: 11760, adjusted: 11760 },
  },
  lead: { leader: 'cat', level: 'slight' },
  me: { faction: null, points: 0, todayLeft: null },
  yesterday: {
    stars: { cat: { userId: 'U_BOB', name: 'Bob', points: 642 }, dog: { userId: 'U_LONG', name: 'Maximilian Alexander Featherstonehaugh', points: 598 } },
    pets: { cat: { petId: 'pet_644053d683e0', name: 'Maodu 毛肚', cells: 188 }, dog: { petId: 'pet_dog', name: 'Banjo', cells: 171 } },
  },
  result: null,
};

export const FACTION_SAMPLES = {
  notJoined: base,
  firstDay: { ...base, yesterday: null, sides: { cat: { members: 2, active: 0, factor: 1, points: 0, adjusted: 0 }, dog: { members: 1, active: 0, factor: 1, points: 0, adjusted: 0 } }, lead: { leader: null, level: 'even' } } satisfies FactionView,
  cat: { ...base, me: { faction: 'cat', points: 1284, todayLeft: 3 } } satisfies FactionView,
  dogFull: { ...base, lead: { leader: 'cat', level: 'clear' }, me: { faction: 'dog', points: 2310, todayLeft: 0 } } satisfies FactionView,
  fog: {
    ...base, phase: 'fog',
    sides: { cat: { ...base.sides.cat, points: null, adjusted: null }, dog: { ...base.sides.dog, points: null, adjusted: null } },
    lead: { leader: 'dog', level: 'slight' }, me: { faction: 'cat', points: 2984, todayLeft: 5 },
  } satisfies FactionView,
  endedWin: {
    ...base, phase: 'ended', yesterday: null,
    me: { faction: 'cat', points: 3120, todayLeft: null },
    result: {
      winner: 'cat',
      top: {
        cat: [{ userId: 'U_BOB', name: 'Bob', points: 3120 }, { userId: 'U_A', name: 'Alice Chen', points: 2990 }, { userId: 'U_Z', name: 'Zhang Wei(张伟)', points: 2511 }],
        dog: [{ userId: 'U_LONG', name: 'Maximilian Alexander Featherstonehaugh', points: 3301 }, { userId: 'U_S', name: 'Samantha Sullivan', points: 2800 }],
      },
      pets: base.yesterday!.pets,
      badge: 'meowchamp26',
    },
  } satisfies FactionView,
  endedLose: {
    ...base, phase: 'ended', yesterday: null,
    me: { faction: 'dog', points: 1500, todayLeft: null },
    result: { winner: 'cat', top: { cat: [], dog: [] }, pets: { cat: null, dog: null }, badge: null },
  } satisfies FactionView,
  endedTie: {
    ...base, phase: 'ended', yesterday: null, lead: { leader: null, level: 'even' },
    me: { faction: 'dog', points: 1500, todayLeft: null },
    result: { winner: null, top: { cat: [], dog: [] }, pets: { cat: null, dog: null }, badge: 'woofchamp26' },
  } satisfies FactionView,
};
