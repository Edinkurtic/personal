// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('electronAPI', {
    notes: {
        getAllNotes: () => ipcRenderer.invoke('getAllNotes'),
        createNote: (note: any) => ipcRenderer.invoke('create:note', note),
        updateNote: (note: any) => ipcRenderer.invoke('update:note', note),
        deleteNote: (id:number) : Promise<{ ok: boolean; error?: string }> => ipcRenderer.invoke('delete:note', id),

        getNoteWithCertainCategory: (category: number) => ipcRenderer.invoke('getNoteWithCertainCategory', category),
        getCategories: () => ipcRenderer.invoke('getCategories'),
        createCategory: (category: string) => ipcRenderer.invoke('createCategory', category),
        deleteCategory: (categoryid: number) => ipcRenderer.invoke('deleteCategory', categoryid),
    },
    folder:{
        addFolder: (folder: any) => ipcRenderer.invoke('addFolder', folder),
        getAllFolders: (): Promise<Folder[]> => ipcRenderer.invoke('getAllFolders'),
        deleteFolder: (folder:Folder) => ipcRenderer.invoke('deleteFolder', folder),

    }
});