// Menu latéral gauche : catégories et sous-catégories toujours dépliées (bourse-custom).
import { User } from '@ghostfolio/common/interfaces';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  albumsOutline,
  analyticsOutline,
  bookOutline,
  bookmarkOutline,
  calculatorOutline,
  flashOutline,
  libraryOutline,
  newspaperOutline,
  peopleOutline,
  pieChartOutline,
  readerOutline,
  scanOutline,
  serverOutline,
  settingsOutline,
  swapVerticalOutline,
  walletOutline
} from 'ionicons/icons';

import { buildSideNav } from './side-nav.helper';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, RouterModule],
  selector: 'gf-side-nav',
  styleUrls: ['./side-nav.component.scss'],
  templateUrl: './side-nav.component.html'
})
export class GfSideNavComponent {
  public readonly user = input<User>();

  protected readonly sections = computed(() => {
    return buildSideNav(this.user());
  });

  public constructor() {
    addIcons({
      albumsOutline,
      analyticsOutline,
      bookOutline,
      bookmarkOutline,
      calculatorOutline,
      flashOutline,
      libraryOutline,
      newspaperOutline,
      peopleOutline,
      pieChartOutline,
      readerOutline,
      scanOutline,
      serverOutline,
      settingsOutline,
      swapVerticalOutline,
      walletOutline
    });
  }
}
