interface Note {
    title: string,
    content: string,
    categoryID: number,
    folderID: number,
}
interface Category {
    id: number,
    name: string,
}

interface Folder {
    id: number,
    name: string,
    colour: string,
}