import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { FormulaEditorComponent, OpenFormulaOptions, TextField } from './formula-editor.component';

/** Một Bảng soạn công thức dùng chung cho cả ứng dụng, gắn vào <body> ở lần mở đầu tiên. */
@Injectable({ providedIn: 'root' })
export class FormulaEditorService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private ref: ComponentRef<FormulaEditorComponent> | null = null;

  open(field: TextField, opts: OpenFormulaOptions = {}): void {
    if (!this.ref) {
      this.ref = createComponent(FormulaEditorComponent, { environmentInjector: this.injector });
      this.appRef.attachView(this.ref.hostView);
      document.body.appendChild(this.ref.location.nativeElement);
      this.ref.changeDetectorRef.detectChanges();
    }
    this.ref.instance.open(field, opts);
  }
}
