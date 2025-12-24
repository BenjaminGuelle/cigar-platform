import { Component, input, computed, Signal, output, OutputEmitterRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconDirective, type IconName } from '../../directives/icon';
import { TooltipDirective } from '../../directives/tooltip';
import clsx from 'clsx';

@Component({
  selector: 'ui-sidebar-nav-item',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective, TooltipDirective],
  template: `
    <a
      [routerLink]="route()"
      routerLinkActive="active"
      [routerLinkActiveOptions]="{ exact: exact() }"
      [class]="itemClasses()"
      [uiTooltip]="!isExpanded() ? label() : ''"
      tooltipPosition="right"
      [tooltipDelay]="200"
      (click)="itemClicked.emit()"
    >
      <div class="flex w-11 shrink-0 items-center justify-center">
        <div class="relative">
          <i [name]="icon()"
            class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
          ></i>

          @if (badge() && badge()! > 0) {
            <span class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-error-500/30">
              {{ badge()! > 99 ? '99+' : badge() }}
            </span>
          }
        </div>
      </div>

      <span [class]="labelClasses()">
        {{ label() }}
      </span>
    </a>
  `,
})
export class SidebarNavItemComponent {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly route = input.required<string>();
  readonly isExpanded = input<boolean>(true);
  readonly exact = input<boolean>(false);
  readonly badge = input<number | null>(null);

  readonly itemClicked: OutputEmitterRef<void> = output<void>();

  readonly itemClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'group relative flex items-center rounded-lg px-3 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'text-smoke-300 hover:text-smoke-50',
      '[&.active]:bg-smoke-700 [&.active]:text-gold-500 '
    );
  });

  readonly labelClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'label transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'overflow-hidden whitespace-nowrap',
      this.isExpanded()
        ? 'opacity-100 max-w-[200px]'
        : 'opacity-0 max-w-0 pointer-events-none'
    );
  });
}