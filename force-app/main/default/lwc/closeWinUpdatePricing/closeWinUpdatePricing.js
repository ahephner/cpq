import { LightningElement, api } from 'lwc';

export default class CloseWinUpdatePricing extends LightningElement {
    @api products = []; 

    handleConfirm(){
        this.dispatchEvent(new CustomEvent('close'));
    }
}