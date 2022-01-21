import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
export default class MobileButtonGroup extends LightningElement {
    @api moveTo;
    mess;
  
    handleReturn(){
        this.mess = 'return';
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
        this.handleNext();
    }

    saveSubmit(){
        this.mess = 'submit';
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
        this.handleNext();
    }

    handleNext(){
        const nextNav = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNav);
    }
}