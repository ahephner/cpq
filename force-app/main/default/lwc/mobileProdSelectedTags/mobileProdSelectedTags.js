import { LightningElement } from 'lwc';

export default class MobileProdSelectedTags extends LightningElement{
    width;
    height; 
    connectedCallback(){
        this.width = window.innerWidth
        console.log(`this viewport's width is ${this.width}`);
        
    }
}