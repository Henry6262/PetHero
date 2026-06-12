import { Loadout, getOwnedItems, normalizeLoadout } from './inventory'
import { api } from '../api/client'

export class GarageUI {
  private root = document.getElementById('garage')!
  private content = document.getElementById('garage-content')!
  private saveBtn = document.getElementById('garage-save')!
  private visible = false
  private loadout: Loadout
  private onChange: (loadout: Loadout) => void

  constructor(initial: Loadout, onChange: (loadout: Loadout) => void) {
    this.loadout = normalizeLoadout(initial)
    this.onChange = onChange
    this.saveBtn.addEventListener('click', () => this.save())
    this.render()
  }

  toggle(): void {
    this.visible = !this.visible
    this.root.style.display = this.visible ? 'block' : 'none'
    if (this.visible) this.render()
  }

  isVisible(): boolean {
    return this.visible
  }

  setLoadout(loadout: Loadout): void {
    this.loadout = normalizeLoadout(loadout)
    if (this.visible) this.render()
  }

  private select(slot: keyof Loadout, value: string | number): void {
    if (slot === 'paint') this.loadout.paint = value as number
    else if (slot === 'spoiler') this.loadout.spoiler = value as string
    else this.loadout[slot] = value as string
    this.onChange(this.loadout)
    this.render()
  }

  private async save(): Promise<void> {
    try {
      await api.saveLoadout(this.loadout)
      this.saveBtn.textContent = 'SAVED!'
      setTimeout(() => (this.saveBtn.textContent = 'SAVE LOADOUT'), 1200)
    } catch (err) {
      console.error('save loadout failed', err)
      this.saveBtn.textContent = 'FAILED'
    }
  }

  private render(): void {
    const items = getOwnedItems()
    const sections: { title: string; slot: keyof Loadout; entries: { id: string; label: string; value: string | number }[] }[] = [
      { title: 'Body', slot: 'body', entries: items.bodies.map((b) => ({ id: b.id, label: b.name, value: b.id })) },
      { title: 'Wheels', slot: 'wheels', entries: items.wheels.map((w) => ({ id: w.id, label: w.name, value: w.id })) },
      { title: 'Spoiler', slot: 'spoiler', entries: items.spoilers.map((s) => ({ id: s.id, label: s.name, value: s.id })) },
      { title: 'Paint', slot: 'paint', entries: items.paints.map((p) => ({ id: p.id, label: p.name, value: p.color })) },
      { title: 'Trail', slot: 'trail', entries: items.trails.map((t) => ({ id: t.id, label: t.name, value: t.id })) },
    ]

    this.content.innerHTML = sections.map((sec) => `
      <div class="section">
        <div style="color:#888;margin-bottom:6px">${sec.title}</div>
        <div class="items">
          ${sec.entries.map((e) => {
            const equipped = this.isEquipped(sec.slot, e.value)
            return `<div class="item ${equipped ? 'equipped' : ''}" data-slot="${sec.slot}" data-value="${e.value}">${e.label}</div>`
          }).join('')}
        </div>
      </div>
    `).join('')

    Array.from(this.content.querySelectorAll('.item')).forEach((el) => {
      el.addEventListener('click', (ev: Event) => {
        const target = ev.currentTarget as HTMLElement
        this.select(target.dataset.slot as keyof Loadout, this.parseValue(target.dataset.value!))
      })
    })
  }

  private isEquipped(slot: keyof Loadout, value: string | number): boolean {
    const current = this.loadout[slot]
    if (slot === 'paint') return current === Number(value)
    if (slot === 'spoiler') return (current ?? 'none') === value
    return current === value
  }

  private parseValue(v: string): string | number {
    const n = Number(v)
    return Number.isNaN(n) ? v : n
  }
}
