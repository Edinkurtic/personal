export interface Note{
  id?: number,
  title: string,
  content: string,
  categoryID: number,
}
export interface Category {
  id: number,
  name: string,
}
export interface Folder {
  id: number,
  name: string,
  colour:string,
}

export interface ToolbarFormat {
  command: string;
  label: string;
  title: string;
  checkActive: string;
}
export interface ToolbarHeading {
  level: 1 | 2 | 3;
  label: string;
  title: string;
}

export interface ToolbarList {
  command: string;
  icon: string;
  title: string;
  checkActive: string;
}

export interface ToolbarHighlight {
  color: string;
  label: string;
}
