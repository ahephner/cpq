import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
export default class MobileButtonGroup extends LightningElement {
    @api moveTo;
    mess;
    shipOptions;
    option
    selectedObj
    @api selectedOption;
    @api prevSelected; 
    @api 
    get addresses(){
        return this.shipOptions || [];
    }
    set addresses(data){
        this.shipOptions = data; 
    }
    connectedCallback(){
        if(this.shipOptions && this.prevSelected){
            console.log('call back');
            
            this.selectedObj =this.shipOptions.find(x => x.Id === this.prevSelected);
            this.selectedOption = this.selectedObj.Id; 
            
        }
    }

    selectChange(){
        let newValue = this.template.querySelector('.slds-select').value;
        this.selectedOption = newValue;
        const attChange = new FlowAttributeChangeEvent('selectedOpton', this.option);
        this.dispatchEvent(attChange);
    }
    handleReturn(){
        this.mess = 'return';
        const attChange = new FlowAttributeChangeEvent('moveTo', this.mess);
        this.dispatchEvent(attChange);
        this.handleNext();
    }

    saveSubmit(){
        if(!this.selectedOption || this.selectedOption ===''){
            alert('add shipping address')
            return; 
        }
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