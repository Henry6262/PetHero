import Phaser from 'phaser'
import { BattleScene, GAME_W, GAME_H } from './game/BattleScene'
import { MenuScene } from './game/MenuScene'
import { DeckBuilderScene } from './game/DeckBuilderScene'

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  transparent: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, BattleScene, DeckBuilderScene],
})
