import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {}