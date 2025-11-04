import {Component, OnDestroy, OnInit} from '@angular/core';
import {FolderAdder} from "../folder-adder/note-adder";
import {Folder, Note} from '../../model/models';
import {ModelService} from '../model.service';
import {NoteService} from '../../services/NoteService';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-side-bar',
    imports: [
        FolderAdder
    ],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css'
})
export class SideBar implements OnInit,OnDestroy{
  isSublistOpen: boolean=false;
  folders: Folder[] = [];
  private folderSub?: Subscription;
  activeNote: Note | null = null;

  constructor(public modelService:ModelService,private noteService:NoteService) {

  }


  async ngOnInit(): Promise<void> {
    this.folders= await this.noteService.getFolders();
    this.modelService.noteClicked$.subscribe(note => {
      this.activeNote = note;
    })
  }
  ngOnDestroy() {
    this.folderSub?.unsubscribe();
  }

  openFolderAdder(): void {
    this.modelService.openFolderAdder()
  }

  toggleSublist(): void {
    this.isSublistOpen = !this.isSublistOpen;
  }
  async deleteFolder(folder: Folder): Promise<void> {
    await this.noteService.deleteFolder(folder);
    this.folders = this.folders.filter(f => f.id !== folder.id)
    this.noteService.notifyFolderChanged()
  }
}
