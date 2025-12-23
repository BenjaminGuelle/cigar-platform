import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { LogoComponent } from '@cigar-platform/shared/ui';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, NgOptimizedImage, LogoComponent],
  template: `
    <div class="flex h-screen bg-linear-to-br from-smoke-950 via-smoke-900 to-smoke-850">
      <!-- LEFT SIDE: Hero Image (hidden on mobile) -->
      <div class="hidden md:flex md:w-1/2 items-center justify-center relative overflow-hidden">
        <!-- IMAGE HERO - bord gauche collé, centrée verticalement -->
        <img
          ngSrc="/images/club.png"
          alt="Cigar Club"
          height="1536"
          width="1024"
          priority
          class="absolute left-0 h-full w-auto object-cover object-left z-0"
        />

        <!-- FADE sur les bords (haut, bas, droite) pour cacher/fondre les bords - accentué -->
        <div class="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-smoke-950 z-10"></div>
        <div class="absolute inset-0 bg-linear-to-b from-smoke-950/70 via-transparent to-smoke-950/70 z-10"></div>

        <!-- VIGNETTE pour accentuer les bords -->
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,5,0.5)_100%)] z-10"></div>

        <!-- OVERLAY GRADIENT pour contraste -->
        <div class="absolute inset-0 bg-linear-to-r from-black/60 via-black/20 to-transparent z-15"></div>

        <!-- EFFET FUMEE accentué -->
        <div class="absolute inset-0 z-20 pointer-events-none">
          <div class="w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05),transparent)] blur-3xl"></div>
          <div class="w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.04),transparent)] blur-3xl"></div>
        </div>

        <!-- LOGO MINI - Top Left -->
        <div class="absolute top-8 left-8 z-30 transition-all duration-300 hover:scale-110">
          <div class="relative">
            <ui-logo variant="compact" size="lg" />
            <!-- Glow effect subtil -->
            <div class="absolute inset-0 rounded-full bg-smoke-50/10 blur-xl -z-10"></div>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDE: Auth Forms (login, register, etc.) -->
      <div class="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-8 lg:px-12 xl:px-32 gap-8">
        <!-- LOGO FULL -->
        <ui-logo variant="full" size="lg" [showTagline]="true" />

        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
