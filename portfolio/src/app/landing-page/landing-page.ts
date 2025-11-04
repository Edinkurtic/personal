import {Component, OnInit} from '@angular/core';
import {NavBar} from '../nav-bar/nav-bar';
import {NgOptimizedImage} from '@angular/common';
import {ChatBot} from '../chat-bot/chat-bot';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-landing-page',
  imports: [
    NavBar,
    ChatBot,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage implements OnInit {
  constructor(private http: HttpClient) {
  }
  ngOnInit(): void {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
      this.http.post("http:/3000/api/users", sessionId)
    }
  }

}
