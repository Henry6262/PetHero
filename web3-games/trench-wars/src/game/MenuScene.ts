import Phaser from 'phaser'
import { createAccount, getMe, getOpponent, connectWallet } from '../api'
import type { Account, Deck } from '../api'
import { BRAND, hexToCss } from '../render/Brand'
import { GAME_W, GAME_H } from './BattleScene'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'

export class MenuScene extends Phaser.Scene {
  private account: Account | null = null
  private statusText!: Phaser.GameObjects.Text
  private menuContainer!: Phaser.GameObjects.Container
  private authContainer!: Phaser.GameObjects.Container

  constructor() {
    super('menu')
  }

  create() {
    this.drawBackground()
    this.drawLogo()

    this.statusText = this.add.text(GAME_W / 2, 230, '', {
      fontFamily: BRAND.fonts.body,
      fontSize: '18px',
      color: BRAND.colors.textMuted,
    }).setOrigin(0.5)

    this.authContainer = this.add.container(0, 0)
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setVisible(false)

    this.buildAuthButtons()
    this.buildMenuButtons()

    ;(window as any).__TRENCH_READY__ = true
    void this.loadAccount()
  }

  private buildAuthButtons() {
    if (isWalletAvailable()) {
      const connect = this.createButton(GAME_W / 2, 340, 'CONNECT WALLET', () => void this.handleConnect())
      this.authContainer.add([connect.bg, connect.text])
    }

    const guest = this.createButton(GAME_W / 2, 410, 'PLAY AS GUEST', () => void this.handleGuest())
    this.authContainer.add([guest.bg, guest.text])
  }

  private buildMenuButtons() {
    const practice = this.createButton(GAME_W / 2, 340, 'PRACTICE VS AI', () => {
      this.scene.start('battle', { mode: 'practice' })
    })
    const ladder = this.createButton(GAME_W / 2, 420, 'LADDER MATCH', () => {
      void this.startLadderMatch()
    })
    const deck = this.createButton(GAME_W / 2, 500, 'DECK BUILDER', () => {
      this.scene.start('deckbuilder')
    })
    this.menuContainer.add([practice.bg, practice.text, ladder.bg, ladder.text, deck.bg, deck.text])
  }

  private drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(BRAND.colors.bg, 1).fillRect(0, 0, GAME_W, GAME_H)

    // subtle diagonal trench grid
    g.lineStyle(1, BRAND.colors.panelBorder, 0.35)
    for (let x = -GAME_H; x < GAME_W; x += 48) {
      g.moveTo(x, 0)
      g.lineTo(x + GAME_H, GAME_H)
    }
    g.strokePath()

    // vignette
    const gradient = this.add.graphics()
    gradient.fillGradientStyle(BRAND.colors.bg, BRAND.colors.bg, 0, 0.9, 1)
    gradient.fillRect(0, 0, GAME_W, GAME_H)
  }

  private drawLogo() {
    const iconY = 110
    const g = this.add.graphics()
    g.fillStyle(BRAND.colors.primary, 1)
    g.beginPath()
    g.moveTo(GAME_W / 2 - 28, iconY + 18)
    g.lineTo(GAME_W / 2, iconY - 18)
    g.lineTo(GAME_W / 2 + 28, iconY + 18)
    g.lineTo(GAME_W / 2 + 14, iconY + 18)
    g.lineTo(GAME_W / 2, iconY + 2)
    g.lineTo(GAME_W / 2 - 14, iconY + 18)
    g.closePath()
    g.fillPath()

    const title = this.add.text(GAME_W / 2, 155, BRAND.name, {
      fontFamily: BRAND.fonts.header,
      fontSize: '40px',
      color: hexToCss(BRAND.colors.primary),
      fontStyle: '900',
    }).setOrigin(0.5)
    title.setShadow(0, 0, hexToCss(BRAND.colors.primary), 12, true, true)

    this.add.text(GAME_W / 2, 188, BRAND.tagline, {
      fontFamily: BRAND.fonts.body,
      fontSize: '16px',
      color: BRAND.colors.textMuted,
      letterSpacing: 3,
    }).setOrigin(0.5)
  }

  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const w = 280
    const h = 58
    const bg = this.add.rectangle(x, y, w, h, BRAND.colors.panel).setInteractive()
    bg.setStrokeStyle(2, BRAND.colors.panelBorder)

    const text = this.add.text(x, y, label, {
      fontFamily: BRAND.fonts.header,
      fontSize: '18px',
      color: BRAND.colors.text,
      fontStyle: '700',
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(BRAND.colors.panelLight)
      bg.setStrokeStyle(2, BRAND.colors.primary)
      text.setColor(hexToCss(BRAND.colors.primary))
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(BRAND.colors.panel)
      bg.setStrokeStyle(2, BRAND.colors.panelBorder)
      text.setColor(BRAND.colors.text)
    })
    bg.on('pointerdown', () => {
      bg.setFillStyle(BRAND.colors.panelBorder)
      onClick()
    })
    return { bg, text }
  }

  private async loadAccount() {
    try {
      const me = await getMe()
      this.setAccount(me.account)
    } catch {
      this.statusText.setText('sign in to play ranked ladder')
    }
  }

  private async handleConnect() {
    this.statusText.setText('connecting wallet...')
    try {
      const pubkey = await connectSolana()
      const res = await connectWallet(pubkey)
      this.setAccount(res.account)
    } catch (err) {
      this.statusText.setText(`wallet failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  private async handleGuest() {
    this.statusText.setText('creating guest account...')
    try {
      const res = await createAccount()
      this.setAccount(res.account)
    } catch (err) {
      this.statusText.setText(`guest login failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  private setAccount(account: Account) {
    this.account = account
    this.statusText.setText(
      `${account.wallet ? account.wallet.slice(0, 8).toUpperCase() : account.id.slice(0, 8).toUpperCase()}  •  ELO ${account.elo}  •  ${account.wins}W / ${account.losses}L`,
    )
    this.authContainer.setVisible(false)
    this.menuContainer.setVisible(true)
  }

  private async startLadderMatch() {
    if (!this.account) {
      this.statusText.setText('sign in first')
      return
    }
    this.statusText.setText('finding opponent...')
    try {
      const opponent = await getOpponent(this.account.elo, this.account.id)
      const defenderDeck: Deck = opponent.deck
      this.scene.start('battle', {
        mode: 'ladder',
        defenderId: opponent.account.id,
        defenderDeck: defenderDeck.cards,
      })
    } catch (err) {
      this.statusText.setText(`matchmaking failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }
}
