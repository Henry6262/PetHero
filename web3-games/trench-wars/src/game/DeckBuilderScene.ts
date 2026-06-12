import Phaser from 'phaser'
import { CARDS, STARTER_DECK } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { getDecks, createDeck, updateDeck } from '../api'
import { BRAND, hexToCss } from '../render/Brand'
import { GAME_W, GAME_H } from './BattleScene'

const CARD_W = 124
const CARD_H = 70
const GAP = 10

export class DeckBuilderScene extends Phaser.Scene {
  private selected: string[] = [...STARTER_DECK]
  private deckId?: string
  private statusText!: Phaser.GameObjects.Text
  private slotTexts: Phaser.GameObjects.Text[] = []

  constructor() {
    super('deckbuilder')
  }

  create() {
    this.drawBackground()

    this.add.text(GAME_W / 2, 40, 'DECK BUILDER', {
      fontFamily: BRAND.fonts.header,
      fontSize: '30px',
      color: hexToCss(BRAND.colors.primary),
      fontStyle: '900',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 72, `pick ${DECK_SIZE} cards`, {
      fontFamily: BRAND.fonts.body,
      fontSize: '15px',
      color: BRAND.colors.textMuted,
    }).setOrigin(0.5)

    this.createButton(70, 40, 'BACK', () => this.scene.start('menu'))
    this.createButton(GAME_W - 70, 40, 'SAVE', () => void this.saveDeck())

    this.statusText = this.add.text(GAME_W / 2, GAME_H - 24, '', {
      fontFamily: BRAND.fonts.body,
      fontSize: '14px',
      color: BRAND.colors.textMuted,
    }).setOrigin(0.5)

    this.drawDeckSlots()
    this.drawRoster()
    void this.loadDeck()
  }

  private drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(BRAND.colors.bg, 1).fillRect(0, 0, GAME_W, GAME_H)
    g.lineStyle(1, BRAND.colors.panelBorder, 0.3)
    for (let x = -GAME_H; x < GAME_W; x += 48) {
      g.moveTo(x, 0)
      g.lineTo(x + GAME_H, GAME_H)
    }
    g.strokePath()
  }

  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, 100, 38, BRAND.colors.panel).setInteractive()
    bg.setStrokeStyle(2, BRAND.colors.panelBorder)
    const text = this.add.text(x, y, label, {
      fontFamily: BRAND.fonts.header,
      fontSize: '14px',
      color: BRAND.colors.text,
      fontStyle: '700',
    }).setOrigin(0.5)
    bg.on('pointerover', () => { bg.setFillStyle(BRAND.colors.panelLight); bg.setStrokeStyle(2, BRAND.colors.primary) })
    bg.on('pointerout', () => { bg.setFillStyle(BRAND.colors.panel); bg.setStrokeStyle(2, BRAND.colors.panelBorder) })
    bg.on('pointerdown', onClick)
    return { bg, text }
  }

  private drawDeckSlots() {
    for (let i = 0; i < DECK_SIZE; i++) {
      const x = 18 + i * (CARD_W + GAP)
      const y = 105
      const bg = this.add.rectangle(x + CARD_W / 2, y + CARD_H / 2, CARD_W, CARD_H, BRAND.colors.panel).setInteractive()
      bg.setStrokeStyle(2, BRAND.colors.panelBorder)
      const t = this.add.text(x + CARD_W / 2, y + CARD_H / 2, '', {
        fontFamily: BRAND.fonts.body,
        fontSize: '12px',
        color: BRAND.colors.text,
        align: 'center',
      }).setOrigin(0.5)
      this.slotTexts.push(t)
      bg.on('pointerdown', () => this.removeCard(i))
    }
    this.refreshSlots()
  }

  private drawRoster() {
    const cols = 2
    const startX = 28
    const startY = 200
    CARDS.forEach((card, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = startX + col * (CARD_W + GAP)
      const y = startY + row * (CARD_H + GAP)
      const bg = this.add.rectangle(x + CARD_W / 2, y + CARD_H / 2, CARD_W, CARD_H, BRAND.colors.panel).setInteractive()
      bg.setStrokeStyle(2, BRAND.colors.panelBorder)
      this.add.text(x + CARD_W / 2, y + 14, card.name.toUpperCase(), {
        fontFamily: BRAND.fonts.body,
        fontSize: '13px',
        color: BRAND.colors.text,
        align: 'center',
      }).setOrigin(0.5)
      this.add.text(x + CARD_W / 2, y + 38, `${card.cost} ELIXIR • ${card.type}`, {
        fontFamily: BRAND.fonts.body,
        fontSize: '11px',
        color: BRAND.colors.textMuted,
      }).setOrigin(0.5)
      bg.on('pointerover', () => bg.setFillStyle(BRAND.colors.panelLight))
      bg.on('pointerout', () => bg.setFillStyle(BRAND.colors.panel))
      bg.on('pointerdown', () => this.addCard(card.id))
    })
  }

  private refreshSlots() {
    this.selected.forEach((id, i) => {
      const card = CARDS.find((c) => c.id === id)!
      this.slotTexts[i].setText(`${card.name.toUpperCase()}\n${card.cost} ELIXIR`)
    })
    for (let i = this.selected.length; i < DECK_SIZE; i++) {
      this.slotTexts[i].setText('')
    }
  }

  private addCard(id: string) {
    if (this.selected.length >= DECK_SIZE) {
      this.statusText.setText('deck is full — click a slot to remove a card')
      return
    }
    if (this.selected.includes(id)) {
      this.statusText.setText('card already in deck')
      return
    }
    this.selected.push(id)
    this.refreshSlots()
    this.statusText.setText(`${this.selected.length}/${DECK_SIZE} selected`)
  }

  private removeCard(index: number) {
    if (index >= this.selected.length) return
    this.selected.splice(index, 1)
    this.refreshSlots()
    this.statusText.setText(`${this.selected.length}/${DECK_SIZE} selected`)
  }

  private async loadDeck() {
    try {
      const { decks } = await getDecks()
      if (decks.length > 0) {
        this.deckId = decks[0].id
        this.selected = [...decks[0].cards]
        this.refreshSlots()
      }
    } catch (err) {
      this.statusText.setText(`failed to load deck: ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  private async saveDeck() {
    if (this.selected.length !== DECK_SIZE) {
      this.statusText.setText(`deck must have exactly ${DECK_SIZE} cards`)
      return
    }
    try {
      if (this.deckId) {
        await updateDeck(this.deckId, 'Ladder', this.selected)
      } else {
        const res = await createDeck('Ladder', this.selected)
        this.deckId = res.deck.id
      }
      this.statusText.setText('deck saved')
    } catch (err) {
      this.statusText.setText(`save failed: ${err instanceof Error ? err.message : 'error'}`)
    }
  }
}
