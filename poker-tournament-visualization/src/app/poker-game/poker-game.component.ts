import { Component, OnChanges, OnInit } from '@angular/core';
import { Game, NewPokerGameService, Stage, Hand } from './new-poker-game.service';
import { TestPokerGameService } from './test-poker-game.service';
import { Subscription } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { HighlightService } from './highlight.service';

@Component({
  selector: 'app-poker-game',
  templateUrl: './poker-game.component.html',
  styleUrls: ['./poker-game.component.css']
})
export class PokerGameComponent implements OnInit, OnChanges {
  syncSubscription: Subscription | undefined;
  highlightHandIds: number[];
  secondsToSee : number = 5*60
  game: Game;
  stage: Stage;
  actionIdx: number = 0;
  handIdx: number;
  isPlay: boolean = false; 
  interestingHandIdx = 0;
  interestingHands : Hand[] = []
  endReached : boolean = false
  speed : number = 100

  constructor(
    private newPokerGameService: NewPokerGameService, 
    private testPokerGameService: TestPokerGameService, 
    private highlightService: HighlightService, 
    private syncService: SyncService) {
    this.game = this.newPokerGameService.getTransformedData()
    this.highlightHandIds = this.highlightService.getHighlightedHands(newPokerGameService.game,this.game, this.secondsToSee*1000/this.speed);
    this.handIdx = this.highlightHandIds[0];
    this.stage = Stage.Preflop;
  }

  ngOnInit(): void {
    this.syncSubscription = this.syncService
      .onMessage()
      .subscribe((message) => {
        if (message && message['cmd'] == 'start') {
          if (!this.isPlay) {
            this.toggle();
          }
        } else if (message && message['cmd'] == 'load') {
          const jsonToPlay = message['table'].find((x: any) => x['id'] == this.syncService.id)['table']
          console.log(jsonToPlay)
        }
      });
  }

  ngOnChanges(): void {
  }

  toggle() {
    this.isPlay = !this.isPlay;
    if (this.isPlay) {
      this.endReached = false;
      this.interestingHandIdx = 0;
      this.interestingHands = this.game.hands.filter( x => this.highlightHandIds.includes(x.handId));
      this.handSliderOnChange(this.interestingHands[this.interestingHandIdx].handId);     
      this.movestep()      
           
    } 
  }

  movestep(){    
    setTimeout(() => {
      if(this.isPlay){
        if (this.actionIdx < this.getMaxActions()) {
          this.sliderOnChange(this.actionIdx + 1);
        }else if (this.actionIdx == this.getMaxActions() && this.endReached) {
          this.interestingHandIdx += 1;
          this.endReached = false;
          if (this.interestingHandIdx < this.highlightHandIds.length -1) {
            this.handSliderOnChange(this.interestingHands[this.interestingHandIdx].handId);
          } else {
            this.handSliderOnChange(this.getMaxHands());
            this.sliderOnChange(this.getMaxActions());
            this.toggle();            
          }
        }else{
          this.endReached = true;
        }
        if(this.isPlay){
          this.movestep()
        }      
        
      }            
    }, this.interestingHands[this.interestingHandIdx].steps[this.actionIdx].timeconstant*this.speed);
  }

  setStage(val?: number): void {
    const newValue = val ?? this.actionIdx;
    let currentStage = Stage.Preflop;
    let stagelist = this.game.hands[this.handIdx].steps.slice(0, newValue+1).filter(obj => obj.boardState?.stage != null)
    this.stage = stagelist.length > 0 ? stagelist[stagelist.length-1].boardState!.stage! : currentStage;
  }

  getMaxActions(): number {
    const actions = this.game.hands[this.handIdx].steps.length - 1;
    return actions; // +1 for the show-down
  }

  sliderOnChange(val: any) {
    this.setStage(val)
    this.actionIdx = val
  }

  getMaxHands(): number {
    const hands = this.game.hands.length - 1;
    return hands; // +1 for the show-down
  }

  handSliderOnChange(val: any) {
    this.handIdx = val;
    this.actionIdx = 0;
  }
}

