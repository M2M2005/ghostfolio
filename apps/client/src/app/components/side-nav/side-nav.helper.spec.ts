import { permissions } from '@ghostfolio/common/permissions';

import '@angular/localize/init';

import { buildSideNav } from './side-nav.helper';

describe('buildSideNav (bourse-custom)', () => {
  const titles = (user?: any) => buildSideNav(user).map(({ title }) => title);

  it('lists every category with its sub categories', () => {
    const sections = buildSideNav({ permissions: [] } as any);
    expect(sections.length).toBeGreaterThanOrEqual(4);
    expect(
      sections[0].items.map(({ routerLink }) => routerLink.join('/'))
    ).toEqual([
      '/home',
      '/home/holdings',
      '/home/summary',
      '/home/watchlist',
      '/home/markets'
    ]);
  });

  it('shows Admin Control only with the permission', () => {
    expect(titles({ permissions: [] })).not.toContain('Admin Control');
    expect(titles({ permissions: [permissions.accessAdminControl] })).toContain(
      'Admin Control'
    );
  });

  it('never links to About', () => {
    const links = buildSideNav({
      permissions: [permissions.accessAdminControl]
    } as any)
      .flatMap(({ items }) => items)
      .map(({ routerLink }) => routerLink.join('/'));
    expect(links.some((link) => link.includes('about'))).toBe(false);
  });
});
