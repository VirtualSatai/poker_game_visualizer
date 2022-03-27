import { Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from './sync.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync',
  templateUrl: './sync.component.html',
  styleUrls: ['./sync.component.css'],
})
export class SyncComponent implements OnInit, OnDestroy {
  subscription: Subscription | undefined;
  messages: any[] = [];
  public id: string = '';
  public status: string = 'idle';
  isPlaying: boolean = false;

  constructor(private service: SyncService) {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.service.onMessage().subscribe((message) => {
      this.handleMessage(message);
    });
    this.service.connect();
    this.service.sendMessage({ cmd: 'connect', type: "client" });
  }

  private handleMessage(message: any) {
    if (message) {
      console.log(message);
      this.messages.push(message);
      if (message['cmd'] == 'ACK') {
        this.id = message['clientId'];
      } else if (message['cmd'] == 'start') {
        this.status = 'start';
      }
    }
  }

  asStr() {
    return JSON.stringify(this.messages[this.messages.length - 1]);
  }

  startForAll() {
    this.service.sendMessage({ cmd: 'start' });
  }
}