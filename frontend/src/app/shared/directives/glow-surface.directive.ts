import { Directive, ElementRef, HostBinding, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appGlowSurface]',
  standalone: true
})
export class GlowSurfaceDirective {
  private readonly element = inject(ElementRef<HTMLElement>);
  private frame = 0;

  @HostBinding('class.glow-surface')
  readonly enabled = true;

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    const target = this.element.nativeElement;
    const bounds = target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      target.style.setProperty('--glow-x', `${x}px`);
      target.style.setProperty('--glow-y', `${y}px`);
      target.dataset.glowActive = 'true';
    });
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    const target = this.element.nativeElement;
    target.dataset.glowActive = 'false';
  }
}
