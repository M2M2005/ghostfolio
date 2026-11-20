// Construction du menu latéral (bourse-custom), sans dépendance Angular : testable seule.
import { User } from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { internalRoutes, publicRoutes } from '@ghostfolio/common/routes/routes';

export interface SideNavItem {
  iconName: string;
  label: string;
  routerLink: string[];
}

export interface SideNavSection {
  items: SideNavItem[];
  title: string;
}

/** Sections du menu, dans l'ordre de l'ancien en-tête, sans « À propos ». */
export function buildSideNav(user?: User): SideNavSection[] {
  const sections: SideNavSection[] = [
    {
      items: [
        {
          iconName: 'analytics-outline',
          label: internalRoutes.home.title,
          routerLink: internalRoutes.home.routerLink
        },
        {
          iconName: 'albums-outline',
          label: internalRoutes.home.subRoutes.holdings.title,
          routerLink: internalRoutes.home.subRoutes.holdings.routerLink
        },
        {
          iconName: 'reader-outline',
          label: internalRoutes.home.subRoutes.summary.title,
          routerLink: internalRoutes.home.subRoutes.summary.routerLink
        },
        {
          iconName: 'bookmark-outline',
          label: internalRoutes.home.subRoutes.watchlist.title,
          routerLink: internalRoutes.home.subRoutes.watchlist.routerLink
        },
        {
          iconName: 'newspaper-outline',
          label: internalRoutes.home.subRoutes.markets.title,
          routerLink: internalRoutes.home.subRoutes.markets.routerLink
        }
      ],
      title: internalRoutes.home.title
    },
    {
      items: [
        {
          iconName: 'analytics-outline',
          label: internalRoutes.portfolio.subRoutes.analysis.title,
          routerLink: internalRoutes.portfolio.routerLink
        },
        {
          iconName: 'swap-vertical-outline',
          label: internalRoutes.portfolio.subRoutes.activities.title,
          routerLink: internalRoutes.portfolio.subRoutes.activities.routerLink
        },
        {
          iconName: 'pie-chart-outline',
          label: internalRoutes.portfolio.subRoutes.allocations.title,
          routerLink: internalRoutes.portfolio.subRoutes.allocations.routerLink
        },
        {
          iconName: 'calculator-outline',
          label: internalRoutes.portfolio.subRoutes.fire.title,
          routerLink: internalRoutes.portfolio.subRoutes.fire.routerLink
        },
        {
          iconName: 'scan-outline',
          label: internalRoutes.portfolio.subRoutes.xRay.title,
          routerLink: internalRoutes.portfolio.subRoutes.xRay.routerLink
        }
      ],
      title: internalRoutes.portfolio.title
    },
    {
      items: [
        {
          iconName: 'wallet-outline',
          label: internalRoutes.accounts.title,
          routerLink: internalRoutes.accounts.routerLink
        }
      ],
      title: internalRoutes.accounts.title
    }
  ];

  if (hasPermission(user?.permissions, permissions.accessAdminControl)) {
    const admin = internalRoutes.adminControl;

    sections.push({
      items: [
        {
          iconName: 'reader-outline',
          label: $localize`Overview`,
          routerLink: admin.routerLink
        },
        {
          iconName: 'settings-outline',
          label: admin.subRoutes.settings.title,
          routerLink: admin.subRoutes.settings.routerLink
        },
        {
          iconName: 'server-outline',
          label: admin.subRoutes.marketData.title,
          routerLink: admin.subRoutes.marketData.routerLink
        },
        {
          iconName: 'flash-outline',
          label: admin.subRoutes.jobs.title,
          routerLink: admin.subRoutes.jobs.routerLink
        },
        {
          iconName: 'people-outline',
          label: admin.subRoutes.users.title,
          routerLink: admin.subRoutes.users.routerLink
        }
      ],
      title: $localize`Admin Control`
    });
  }

  const resources = publicRoutes.resources;

  sections.push({
    items: [
      {
        iconName: 'reader-outline',
        label: $localize`Overview`,
        routerLink: resources.routerLink
      },
      {
        iconName: 'book-outline',
        label: resources.subRoutes.guides.title,
        routerLink: resources.subRoutes.guides.routerLink
      },
      {
        iconName: 'newspaper-outline',
        label: resources.subRoutes.markets.title,
        routerLink: resources.subRoutes.markets.routerLink
      },
      {
        iconName: 'library-outline',
        label: resources.subRoutes.glossary.title,
        routerLink: resources.subRoutes.glossary.routerLink
      }
    ],
    title: resources.title
  });

  return sections;
}
