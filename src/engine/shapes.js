export function createRect(x,y,width,height){
    return{
    id:crypto.randomUUID(),
    type:"rect",
    x,
    y,
    width,
    height
    }
}